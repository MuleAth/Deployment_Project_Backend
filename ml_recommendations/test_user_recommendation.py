import sys
import json
from recommendation_system import generate_recommendations

def main():
    # Test with a specific user ID
    user_id = "67ca8f335e3b5416eb593a73"  # Nikhil Mogare with Basketball interest
    
    print(f"Testing recommendations for user {user_id}")
    recommendations_json = generate_recommendations(user_id)
    
    # Parse the JSON to pretty print
    try:
        recommendations = json.loads(recommendations_json)
        print(f"Found {len(recommendations)} recommendations")
        
        for idx, rec in enumerate(recommendations, 1):
            print(f"\nRecommendation {idx}:")
            print(f"  Title: {rec.get('title', 'Unknown')}")
            print(f"  Sports: {rec.get('sportsCategory', 'Unknown')}")
            print(f"  Event ID: {rec.get('_id', 'Unknown')}")
    except json.JSONDecodeError:
        print("Error parsing recommendations JSON")
        print(f"Raw output: {recommendations_json}")

if __name__ == "__main__":
    main()