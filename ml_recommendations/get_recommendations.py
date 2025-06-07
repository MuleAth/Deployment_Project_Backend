import sys
import json
from recommendation_system import generate_recommendations, generate_recommendations_for_all_users
from fetch_data import fetch_users

def get_all_user_ids():
    """Fetch all user IDs from the API"""
    try:
        users = fetch_users()
        return [user["_id"] for user in users if user.get("_id")]
    except Exception as e:
        print(f"Error fetching user IDs: {str(e)}")
        return []

if __name__ == "__main__":
    # Get user ID from command line arguments
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
        try:
            # Generate recommendations for the user (log to stderr instead of stdout)
            print(f"Generating recommendations for user ID: {user_id}", file=sys.stderr)
            recommendations_json = generate_recommendations(user_id)

            # If recommendations_json is empty, return an empty array
            if not recommendations_json or recommendations_json == "[]":
                print(f"No recommendations found for user {user_id}. Returning empty array.", file=sys.stderr)
                print("[]")  # This goes to stdout
            else:
                # Print the JSON to stdout (will be captured by Node.js)
                # Make sure only the JSON is printed to stdout
                print(recommendations_json)  # This goes to stdout
        except Exception as e:
            # Print error message to stderr
            error_msg = f"Error generating recommendations: {str(e)}"
            print(f"Error: {error_msg}", file=sys.stderr)
            sys.stderr.write(error_msg)
            sys.exit(1)
    else:
        # No user ID provided, generate recommendations for all users
        try:
            print("No user ID provided. Generating recommendations for all users...", file=sys.stderr)
            all_recommendations = generate_recommendations_for_all_users()
            recommendations_json = json.dumps(all_recommendations)
            print(recommendations_json)  # This goes to stdout
        except Exception as e:
            error_msg = f"Error generating recommendations for all users: {str(e)}"
            print(f"Error: {error_msg}", file=sys.stderr)
            sys.stderr.write(error_msg)
            sys.exit(1)