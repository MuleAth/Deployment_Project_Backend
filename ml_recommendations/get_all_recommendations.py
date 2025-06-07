import sys
import json
from recommendation_system import generate_recommendations_for_all_users

if __name__ == "__main__":
    try:
        # Generate recommendations for all users
        all_recommendations = generate_recommendations_for_all_users()
        
        # Convert the recommendations to JSON
        recommendations_json = json.dumps(all_recommendations)
        
        # Print the JSON to stdout (will be captured by Node.js)
        print(recommendations_json)
    except Exception as e:
        # Print error message to stderr
        sys.stderr.write(f"Error generating recommendations: {str(e)}")
        sys.exit(1)