import json
from recommendation_system import generate_recommendations_for_all_users

if __name__ == "__main__":
    print("Generating recommendations for all users...")
    all_user_recommendations = generate_recommendations_for_all_users()
    print(f"Generated recommendations for {len(all_user_recommendations)} users")

    for user_rec in all_user_recommendations:
        user_id = user_rec["user_id"]
        recommendations = user_rec["recommendations"]

        # Ensure recommendations is a list of dictionaries
        if isinstance(recommendations, str):
            try:
                recommendations = json.loads(recommendations)
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON for user {user_id}: {str(e)}")
                print(f"Raw recommendations: {recommendations}")
                continue

        if not recommendations:
            print(f"No recommendations for user {user_id}")
            print("=" * 50)
            continue

        # Retrieve the user's name from the first recommendation
        user_name = recommendations[0].get('user_name', "Unknown User") if recommendations else "Unknown User"

        print(f"User Name: {user_name}")
        print(f"User ID: {user_id}")
        print("Recommended Events:")

        for idx, event in enumerate(recommendations, start=1):
            print(f"  {idx}. Event Name: {event.get('title', 'Untitled Event')}")
            print(f"     Event ID: {event.get('_id', 'No ID')}")
            print(f"     Sports Category: {event.get('sportsCategory', 'No Category')}")
            print(f"     Registration URL: http://localhost:5173/events/{event.get('_id', '')}?register=true")
            print()

        print("=" * 50)
