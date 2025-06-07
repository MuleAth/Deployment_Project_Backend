import numpy as np
import pandas as pd
from sklearn.decomposition import NMF
import sys

def collaborative_filtering_recommendation(user_id, users_df, events_df):
    """
    Generate collaborative filtering recommendations using NMF
    Works with both list and string inputs for user interests and event categories
    """
    # If no users or events, return empty DataFrame
    if users_df.empty or events_df.empty:
        print("No users or events data available for collaborative filtering", file=sys.stderr)
        return pd.DataFrame()

    try:
        # Create user-event interactions based on sports interests
        interactions = []
        print(f"Building interaction matrix for {len(users_df)} users and {len(events_df)} events", file=sys.stderr)

        # For each user
        for _, user in users_df.iterrows():
            user_interests = user["sports_interest"]
            user_id_val = user["_id"]

            # For each event
            for _, event in events_df.iterrows():
                event_categories = event["sportsCategory"]
                event_id_val = event["_id"]

                # Ensure user_interests is a list
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
                
                # Skip if no valid interests
                if not normalized_interests:
                    continue
                
                # Ensure event_categories is a list
                if isinstance(event_categories, str):
                    # Handle comma-separated string from react-select
                    event_categories = [category.strip() for category in event_categories.split(',') if category.strip()]
                elif not isinstance(event_categories, (list, tuple)):
                    event_categories = [str(event_categories)]
                
                # First try exact matching with improved handling
                exact_match = any(
                    any(interest == str(category).lower().strip() 
                        for category in event_categories if isinstance(category, str))
                    for interest in normalized_interests
                )
                
                # If no exact match, try matching with original_category if available
                if not exact_match and 'original_category' in event:
                    original_category = event['original_category']
                    if original_category and isinstance(original_category, str):
                        exact_match = any(
                            interest.lower() == original_category.lower() 
                            for interest in normalized_interests
                        )
                
                # If still no exact match, try partial matching with improved handling
                partial_match = False
                if not exact_match:
                    # Try matching with sportsCategory_str if available
                    if 'sportsCategory_str' in event:
                        category_str = str(event['sportsCategory_str']).lower()
                        partial_match = any(
                            interest in category_str
                            for interest in normalized_interests
                        )
                    else:
                        # Fall back to joining the categories
                        try:
                            category_str = " ".join(str(cat).lower() for cat in event_categories if cat)
                            partial_match = any(
                                interest in category_str
                                for interest in normalized_interests
                            )
                        except Exception as e:
                            print(f"Error in partial matching: {str(e)}", file=sys.stderr)
                            partial_match = False
                
                # Use either exact or partial match with different weights
                if exact_match:
                    # Higher weight for exact matches
                    interactions.append((user_id_val, event_id_val, 2))
                elif partial_match:
                    # Lower weight for partial matches
                    interactions.append((user_id_val, event_id_val, 1))

        # If no interactions, return empty DataFrame
        if not interactions:
            print("No interactions found for collaborative filtering", file=sys.stderr)
            return pd.DataFrame()

        # Convert interactions to DataFrame
        interactions_df = pd.DataFrame(interactions, columns=["user_id", "event_id", "rating"])
        print(f"Created interaction matrix with {len(interactions_df)} interactions", file=sys.stderr)

        # Create user-event matrix
        user_event_matrix = interactions_df.pivot(
            index="user_id", columns="event_id", values="rating"
        ).fillna(0)
        
        print(f"User-event matrix shape: {user_event_matrix.shape}", file=sys.stderr)

        # If user not in matrix, return empty DataFrame
        if user_id not in user_event_matrix.index:
            print(f"User {user_id} not found in interaction matrix", file=sys.stderr)
            return pd.DataFrame()

        # Apply NMF with appropriate number of components
        n_components = min(5, min(user_event_matrix.shape) - 1)
        if n_components <= 0:
            print("Matrix too small for NMF decomposition", file=sys.stderr)
            return pd.DataFrame()

        print(f"Using {n_components} components for NMF", file=sys.stderr)
        model = NMF(n_components=n_components, init="random", random_state=42, max_iter=200)
        
        try:
            W = model.fit_transform(user_event_matrix)
            H = model.components_
            
            # Get user index
            user_index = user_event_matrix.index.get_loc(user_id)
            
            # Calculate scores
            scores = np.dot(W[user_index], H)
            
            # Get top recommendations
            top_n = min(5, len(events_df))
            if top_n == 0:
                return pd.DataFrame()
            
            # Map column indices to event indices
            event_ids = user_event_matrix.columns
            event_indices = {}
            for event_id in event_ids:
                matches = events_df[events_df['_id'] == event_id]
                if not matches.empty:
                    event_indices[event_id] = matches.index[0]
            
            # Get top recommendations
            top_event_indices = []
            for idx in np.argsort(-scores)[:top_n]:
                if idx < len(event_ids):
                    event_id = event_ids[idx]
                    if event_id in event_indices:
                        top_event_indices.append(event_indices[event_id])
            
            if not top_event_indices:
                print("No valid event indices found after NMF", file=sys.stderr)
                return pd.DataFrame()
            
            recommended_events = events_df.iloc[top_event_indices].copy()
            print(f"Generated {len(recommended_events)} collaborative filtering recommendations", file=sys.stderr)
            
            return recommended_events
            
        except Exception as nmf_error:
            print(f"NMF algorithm failed: {str(nmf_error)}", file=sys.stderr)
            print("Falling back to simple frequency-based recommendations", file=sys.stderr)
            
            # Fallback: use most frequent interactions
            event_counts = interactions_df['event_id'].value_counts()
            top_events = event_counts.head(5).index.tolist()
            
            # Get corresponding events
            fallback_recommendations = events_df[events_df['_id'].isin(top_events)]
            print(f"Generated {len(fallback_recommendations)} fallback recommendations", file=sys.stderr)
            
            return fallback_recommendations
            
    except Exception as e:
        print(f"Error in collaborative filtering: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return pd.DataFrame()