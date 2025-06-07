from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import sys

def content_based_recommendation(user_interests, events_df):
    """
    Generate content-based recommendations using TF-IDF and cosine similarity
    Works with both list and string inputs for user_interests
    Enhanced to handle react-select format (comma-separated values from multi-select)
    """
    # If no events or no user interests, return empty DataFrame
    if events_df.empty or not user_interests:
        print("No events data or user interests available for content-based filtering", file=sys.stderr)
        return pd.DataFrame()

    # Ensure user_interests is a list of strings
    if isinstance(user_interests, str):
        # Handle comma-separated string from react-select
        user_interests = [interest.strip() for interest in user_interests.split(',') if interest.strip()]
    elif isinstance(user_interests, tuple):
        user_interests = list(user_interests)
        
    # Normalize user interests to lowercase for consistent matching
    normalized_interests = []
    for interest in user_interests:
        if isinstance(interest, str) and interest.strip():
            normalized_interests.append(interest.lower().strip())
        elif isinstance(interest, dict) and 'value' in interest:
            # Handle react-select format: {value: 'football', label: 'Football'}
            normalized_interests.append(interest['value'].lower().strip())
    
    if not normalized_interests:
        print("No valid interests after normalization", file=sys.stderr)
        return pd.DataFrame()
        
    # Combine user interests into a single string for TF-IDF
    user_interests_str = " ".join(normalized_interests)
    print(f"User interests string for TF-IDF: '{user_interests_str}'", file=sys.stderr)

    # Make sure sportsCategory_str exists
    if "sportsCategory_str" not in events_df.columns:
        events_df["sportsCategory_str"] = events_df["sportsCategory"].apply(
            lambda x: " ".join(x) if isinstance(x, (list, tuple)) else str(x)
        )

    # TF-IDF Vectorization
    tfidf = TfidfVectorizer(lowercase=True, stop_words='english')

    try:
        # Print some debug info
        print(f"Number of events for TF-IDF: {len(events_df)}", file=sys.stderr)
        print(f"Sample event categories: {events_df['sportsCategory_str'].iloc[0] if not events_df.empty else 'None'}", file=sys.stderr)
        
        # Fit and transform the event categories
        tfidf_matrix = tfidf.fit_transform(events_df["sportsCategory_str"])
        print(f"TF-IDF matrix shape: {tfidf_matrix.shape}", file=sys.stderr)

        # Transform user interests into TF-IDF vector
        user_interests_vector = tfidf.transform([user_interests_str])

        # Calculate cosine similarity between user interests and event categories
        similarity_scores = cosine_similarity(user_interests_vector, tfidf_matrix)
        print(f"Max similarity score: {similarity_scores.max()}", file=sys.stderr)

        # Get top N recommendations (or all if less than N)
        top_n = min(10, len(events_df))  # Increased from 5 to 10 for more candidates
        if top_n == 0:
            return pd.DataFrame()

        top_indices = similarity_scores.argsort()[0][-top_n:][::-1]
        recommendations = events_df.iloc[top_indices].copy()
        
        # First try exact matching with improved handling
        exact_matches = recommendations[
            recommendations["sportsCategory"].apply(
                lambda categories: any(
                    any(interest == category.lower().strip() 
                        for category in categories if isinstance(category, str))
                    for interest in normalized_interests
                ) if isinstance(categories, (list, tuple)) else False
            )
        ]
        
        # If we have exact matches, use them
        if not exact_matches.empty:
            print(f"Found {len(exact_matches)} exact matches in content-based filtering", file=sys.stderr)
            filtered_recommendations = exact_matches
        else:
            # Otherwise, fall back to partial matching with improved handling
            print("No exact matches found in content-based filtering, using partial matching", file=sys.stderr)
            
            # Try matching with original_category first
            if 'original_category' in recommendations.columns:
                original_matches = recommendations[
                    recommendations['original_category'].apply(
                        lambda category: any(
                            interest.lower() in category.lower() for interest in normalized_interests
                        ) if category else False
                    )
                ]
                
                if not original_matches.empty:
                    print(f"Found {len(original_matches)} matches using original category", file=sys.stderr)
                    filtered_recommendations = original_matches
                else:
                    # Fall back to sportsCategory matching
                    filtered_recommendations = recommendations[
                        recommendations["sportsCategory"].apply(
                            lambda x: any(
                                interest in " ".join([str(cat) for cat in x]).lower() 
                                for interest in normalized_interests
                            ) if isinstance(x, (list, tuple)) else False
                        )
                    ]
            else:
                # Fall back to sportsCategory matching
                filtered_recommendations = recommendations[
                    recommendations["sportsCategory"].apply(
                        lambda x: any(
                            interest in " ".join([str(cat) for cat in x]).lower() 
                            for interest in normalized_interests
                        ) if isinstance(x, (list, tuple)) else False
                    )
                ]

        # If we still have no recommendations, return the top similarity matches
        if filtered_recommendations.empty:
            print("No matches found after filtering, returning top similarity matches", file=sys.stderr)
            # Take top 5 from the original similarity-based recommendations
            filtered_recommendations = recommendations.head(5)

        print(f"Generated {len(filtered_recommendations)} content-based recommendations", file=sys.stderr)
        return filtered_recommendations
    except Exception as e:
        print(f"Error in content-based filtering: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return pd.DataFrame()
