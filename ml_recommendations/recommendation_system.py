import pandas as pd
import json
import sys
from fetch_data import fetch_events, fetch_users
from preprocess_data import preprocess_events, preprocess_users
from content_based_filtering import content_based_recommendation
from collaborative_filtering import collaborative_filtering_recommendation


def filter_by_user_interests(recommendations, user_interests):
    """
    Filter recommendations by user interests with improved matching
    Works with both list and string inputs for user_interests
    Enhanced to handle react-select format (comma-separated values from multi-select)
    """
    if recommendations.empty:
        return pd.DataFrame()
        
    if 'sportsCategory_str' not in recommendations.columns:
        print("Warning: sportsCategory_str not found in recommendations", file=sys.stderr)
        # Try to create it if possible
        if 'sportsCategory' in recommendations.columns:
            recommendations['sportsCategory_str'] = recommendations['sportsCategory'].apply(
                lambda x: " ".join(x) if isinstance(x, (list, tuple)) else str(x)
            )
        else:
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
        print("No valid interests after normalization in filter_by_user_interests", file=sys.stderr)
        return pd.DataFrame()
    
    print(f"Filtering recommendations with interests: {normalized_interests}", file=sys.stderr)
    
    # First try exact matching with improved handling
    exact_matches = recommendations[
        recommendations['sportsCategory'].apply(
            lambda categories: any(
                any(interest.lower() == category.lower() 
                    for category in categories if isinstance(category, str))
                for interest in normalized_interests
            ) if isinstance(categories, (list, tuple)) else False
        )
    ]
    
    # If we have exact matches, return them
    if not exact_matches.empty:
        print(f"Found {len(exact_matches)} exact matches in filter_by_user_interests", file=sys.stderr)
        return exact_matches
    
    # Otherwise, fall back to partial matching with improved logic
    print("No exact matches found in filter_by_user_interests, using partial matching", file=sys.stderr)
    
    # Try matching with original_category if available
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
            return original_matches
    
    # Fall back to sportsCategory_str matching
    partial_matches = recommendations[
        recommendations['sportsCategory_str'].apply(
            lambda category: any(
                interest.lower() in str(category).lower() for interest in normalized_interests
            ) if category else False
        )
    ]
    
    if not partial_matches.empty:
        print(f"Found {len(partial_matches)} partial matches using sportsCategory_str", file=sys.stderr)
        return partial_matches
    
    # If still no matches, return a subset of the original recommendations
    print("No matches found after all filtering attempts, returning top recommendations", file=sys.stderr)
    return recommendations.head(3)


def generate_recommendations(user_id):
    """Generate recommendations for a specific user"""
    try:
        # Use stderr for logging
        print(f"Generating recommendations for user {user_id}", file=sys.stderr)

        # Fetch data from API
        events = fetch_events()
        users = fetch_users()

        # Check if we have events and users data
        if not events or len(events) == 0:
            print("Warning: No events data available", file=sys.stderr)
            return json.dumps([])

        if not users or len(users) == 0:
            print("Warning: No users data available", file=sys.stderr)
            return json.dumps([])

        # Preprocess data
        events_df = preprocess_events(events)
        users_df = preprocess_users(users)

        # Check if the user exists
        user_matches = users_df[users_df["_id"] == user_id]
        if user_matches.empty:
            print(f"Warning: User with ID {user_id} not found", file=sys.stderr)
            return json.dumps([])

        user = user_matches.iloc[0]

        # Check if user has sports interests
        user_interests = None
        
        # Try different fields that might contain sports interests
        if "sports_interest" in user and user["sports_interest"]:
            user_interests = user["sports_interest"]
            print(f"Using sports_interest field: {user_interests}", file=sys.stderr)
        elif "sportsInterest" in user and user["sportsInterest"]:
            user_interests = user["sportsInterest"]
            print(f"Using sportsInterest field: {user_interests}", file=sys.stderr)
        elif "preferredSports" in user and user["preferredSports"]:
            user_interests = user["preferredSports"]
            print(f"Using preferredSports field: {user_interests}", file=sys.stderr)
        
        # If still no interests, try to use registeredEvents categories
        if not user_interests and "registeredEvents" in user and user["registeredEvents"]:
            event_categories = []
            for event in user["registeredEvents"]:
                if "sportsCategory" in event:
                    if isinstance(event["sportsCategory"], list):
                        event_categories.extend(event["sportsCategory"])
                    else:
                        event_categories.append(event["sportsCategory"])

            if event_categories:
                user_interests = list(set(event_categories))  # Remove duplicates
                print(f"Using categories from registeredEvents: {user_interests}", file=sys.stderr)
        
        # If still no interests, use popular categories as default
        if not user_interests:
            print(f"Warning: User with ID {user_id} has no sports interests", file=sys.stderr)
            # Use the most popular categories from all events
            if not events_df.empty:
                # Extract all categories and find the most common ones
                all_categories = []
                for cats in events_df["sportsCategory"]:
                    if isinstance(cats, (list, tuple)):
                        all_categories.extend(cats)
                    else:
                        all_categories.append(str(cats))
                
                # Count occurrences of each category
                from collections import Counter
                category_counts = Counter(all_categories)
                
                # Use the top 3 most common categories
                popular_categories = [cat for cat, _ in category_counts.most_common(3)]
                
                if popular_categories:
                    user_interests = popular_categories
                    print(f"Using popular categories as default interests: {user_interests}", file=sys.stderr)
                else:
                    # If still no categories, use default recommendations
                    default_recs = events_df.sort_values(by="createdAt", ascending=False).head(3)
                    default_recs["user_name"] = user.get("fullname", "User")
                    default_recs["sportsCategory"] = default_recs["sportsCategory"].apply(
                        lambda x: ", ".join(x) if isinstance(x, (list, tuple)) else str(x)
                    )
                    # Mark as fallback recommendations
                    default_recs["recommendationSource"] = "fallback"
                    default_recs["recommendationType"] = "Recent events (no user interests available)"
                    # Add timestamp
                    from datetime import datetime
                    default_recs["generatedAt"] = datetime.now().isoformat()
                    print(f"Returning {len(default_recs)} default recommendations", file=sys.stderr)
                    return default_recs.to_json(orient="records")
            else:
                return json.dumps([])

        print(f"User {user_id} has interests: {user_interests}", file=sys.stderr)

        # Generate recommendations
        content_recs = content_based_recommendation(user_interests, events_df)
        collab_recs = collaborative_filtering_recommendation(user_id, users_df, events_df)

        # If both recommendation methods return empty DataFrames, return some default recommendations
        if content_recs.empty and collab_recs.empty:
            print(f"Warning: No recommendations generated for user {user_id}", file=sys.stderr)
            # Return some default recommendations instead of empty
            if not events_df.empty:
                # Return top 3 most recent events
                default_recs = events_df.sort_values(by="createdAt", ascending=False).head(3)
                default_recs["user_name"] = user.get("fullname", "User")
                default_recs["sportsCategory"] = default_recs["sportsCategory"].apply(
                    lambda x: ", ".join(x) if isinstance(x, (list, tuple)) else str(x)
                )
                # Mark as fallback recommendations
                default_recs["recommendationSource"] = "fallback"
                default_recs["recommendationType"] = "Recent events (no user interests available)"
                # Add timestamp
                from datetime import datetime
                default_recs["generatedAt"] = datetime.now().isoformat()
                print(f"Returning {len(default_recs)} default recommendations", file=sys.stderr)
                return default_recs.to_json(orient="records")
            return json.dumps([])

        # Process collaborative filtering recommendations
        if not collab_recs.empty:
            if "sportsCategory_str" not in collab_recs.columns:
                collab_recs.loc[:, "sportsCategory_str"] = collab_recs["sportsCategory"].apply(
                    lambda x: " ".join(x) if isinstance(x, (list, tuple)) else str(x)
                )
            filtered_collab = filter_by_user_interests(collab_recs, user_interests)
            if not filtered_collab.empty:
                filtered_collab.loc[:, "sportsCategory"] = filtered_collab["sportsCategory"].apply(
                    lambda x: ", ".join(x) if isinstance(x, (list, tuple)) else str(x)
                )
        else:
            filtered_collab = pd.DataFrame()

        # Process content-based recommendations
        if not content_recs.empty:
            content_recs.loc[:, "sportsCategory"] = content_recs["sportsCategory"].apply(
                lambda x: ", ".join(x) if isinstance(x, (list, tuple)) else str(x)
            )
            # Mark as ML-based recommendations
            content_recs.loc[:, "recommendationSource"] = "ml_content"
            content_recs.loc[:, "recommendationType"] = "Content-based filtering using TF-IDF"

        # Mark collaborative filtering recommendations
        if not filtered_collab.empty:
            filtered_collab.loc[:, "recommendationSource"] = "ml_collaborative"
            filtered_collab.loc[:, "recommendationType"] = "Collaborative filtering using NMF"

        # Combine recommendations
        combined = pd.concat([content_recs, filtered_collab]).drop_duplicates()

        # If we have recommendations, add user name
        if not combined.empty:
            combined["user_name"] = user.get("fullname", "User")
            # Add timestamp for when recommendations were generated
            from datetime import datetime
            combined["generatedAt"] = datetime.now().isoformat()
            result_json = combined.to_json(orient="records")
            print(f"Returning {len(combined)} recommendations for user {user_id}", file=sys.stderr)
            return result_json
        else:
            print(f"No recommendations after combining for user {user_id}", file=sys.stderr)
            return json.dumps([])
    except Exception as e:
        print(f"Error generating recommendations: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return json.dumps({"error": str(e)})


def generate_recommendations_for_all_users():
    """Generate recommendations for all users with sports interests"""
    try:
        print("Fetching data for all users...")

        # Fetch data from API
        events = fetch_events()
        users = fetch_users()

        # Check if we have events and users data
        if not events or len(events) == 0:
            print("Warning: No events data available")
            return []

        if not users or len(users) == 0:
            print("Warning: No users data available")
            return []

        # Preprocess data
        events_df = preprocess_events(events)
        users_df = preprocess_users(users)

        if users_df.empty:
            print("Warning: No users with sports interests found")
            return []

        all_recommendations = []
        print(f"Generating recommendations for {len(users_df)} users...")

        for _, user in users_df.iterrows():
            try:
                user_id = user["_id"]
                user_interests = user["sports_interest"]

                print(f"Processing user {user_id} with interests {user_interests}")

                # Skip users with no interests
                if not user_interests:
                    print(f"Warning: User with ID {user_id} has no sports interests, skipping")
                    continue

                # Generate recommendations
                content_recs = content_based_recommendation(user_interests, events_df)
                collab_recs = collaborative_filtering_recommendation(user_id, users_df, events_df)

                # If both recommendation methods return empty DataFrames, skip this user
                if content_recs.empty and collab_recs.empty:
                    print(f"Warning: No recommendations generated for user {user_id}, skipping")
                    continue

                # Process collaborative filtering recommendations
                if not collab_recs.empty:
                    if "sportsCategory_str" not in collab_recs.columns:
                        collab_recs.loc[:, "sportsCategory_str"] = collab_recs["sportsCategory"].apply(
                            lambda x: " ".join(x) if isinstance(x, (list, tuple)) else str(x)
                        )
                    filtered_collab = filter_by_user_interests(collab_recs, user_interests)
                    if not filtered_collab.empty:
                        filtered_collab = filtered_collab.copy()
                        filtered_collab["sportsCategory"] = filtered_collab["sportsCategory"].apply(
                            lambda x: ", ".join(x) if isinstance(x, (list, tuple)) else str(x)
                        )
                else:
                    filtered_collab = pd.DataFrame()

                # Process content-based recommendations
                if not content_recs.empty:
                    content_recs["sportsCategory"] = content_recs["sportsCategory"].apply(
                        lambda x: ", ".join(x) if isinstance(x, (list, tuple)) else str(x)
                    )

                # Combine recommendations
                combined = pd.concat([content_recs, filtered_collab]).drop_duplicates()

                # If we have recommendations, add user name and append to results
                if not combined.empty:
                    combined["user_name"] = user["fullname"]
                    recommendations_json = combined.to_json(orient="records")
                    all_recommendations.append({
                        "user_id": user_id,
                        "recommendations": recommendations_json
                    })
                    print(f"Added {len(combined)} recommendations for user {user_id}")
                else:
                    print(f"No recommendations for user {user_id} after filtering")
            except Exception as e:
                print(f"Error generating recommendations for user {user_id}: {str(e)}")
                continue

        print(f"Generated recommendations for {len(all_recommendations)} users")
        return all_recommendations
    except Exception as e:
        print(f"Error generating recommendations for all users: {str(e)}")
        return []
