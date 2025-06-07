import pandas as pd
import json
from fetch_data import fetch_events, fetch_users
from preprocess_data import preprocess_events, preprocess_users
from content_based_filtering import content_based_recommendation
from collaborative_filtering import collaborative_filtering_recommendation


def filter_by_user_interests(recommendations, user_interests):
    """Filter recommendations by user interests"""
    if 'sportsCategory_str' not in recommendations.columns:
        return pd.DataFrame()

    return recommendations[
        recommendations['sportsCategory_str'].apply(
            lambda category: any(interest.lower() in category.lower() for interest in user_interests)
        )
    ]


def generate_recommendations(user_id):
    """Generate recommendations for a specific user"""
    try:
        print(f"Generating recommendations for user {user_id}")

        # Fetch data from API
        events = fetch_events()
        users = fetch_users()

        # Check if we have events and users data
        if not events or len(events) == 0:
            print("Warning: No events data available")
            return json.dumps([])

        if not users or len(users) == 0:
            print("Warning: No users data available")
            return json.dumps([])

        # Preprocess data
        events_df = preprocess_events(events)
        users_df = preprocess_users(users)

        # Check if the user exists
        user_matches = users_df[users_df["_id"] == user_id]
        if user_matches.empty:
            print(f"Warning: User with ID {user_id} not found or has no sports interests")
            return json.dumps([])

        user = user_matches.iloc[0]
        user_interests = user["sports_interest"]

        # If user has no interests, return empty recommendations
        if not user_interests:
            print(f"Warning: User with ID {user_id} has no sports interests")
            return json.dumps([])

        print(f"User {user_id} has interests: {user_interests}")

        # Generate recommendations
        content_recs = content_based_recommendation(user_interests, events_df)
        collab_recs = collaborative_filtering_recommendation(user_id, users_df, events_df)

        # If both recommendation methods return empty DataFrames, return empty list
        if content_recs.empty and collab_recs.empty:
            print(f"Warning: No recommendations generated for user {user_id}")
            return json.dumps([])

        # Process collaborative filtering recommendations
        if not collab_recs.empty:
            if "sportsCategory_str" not in collab_recs.columns:
                collab_recs.loc[:, "sportsCategory_str"] = collab_recs["sportsCategory"].apply(
                    lambda x: " ".join(x) if isinstance(x, (list, tuple)) else str(x)
                )
            filtered_collab = filter_by_user_interests(collab_recs, user_interests)
            if not filtered_collab.empty:
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

        # If we have recommendations, add user name
        if not combined.empty:
            combined["user_name"] = user["fullname"]
            return combined.to_json(orient="records")
        else:
            return json.dumps([])
    except Exception as e:
        print(f"Error generating recommendations: {str(e)}")
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
