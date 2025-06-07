import sys
import json
from recommendation_system import generate_recommendations

def main():
    # Check if user ID is provided as command-line argument
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
        print(f"Testing recommendations for user ID: {user_id}")
        
        # Generate recommendations
        recommendations_json = generate_recommendations(user_id)
        
        # Parse the JSON to pretty print
        try:
            recommendations = json.loads(recommendations_json)
            if isinstance(recommendations, dict) and "error" in recommendations:
                print(f"Error: {recommendations['error']}")
                return
                
            print(f"Found {len(recommendations)} recommendations")
            
            for idx, rec in enumerate(recommendations, 1):
                print(f"\nRecommendation {idx}:")
                print(f"  Title: {rec.get('title', 'Unknown')}")
                print(f"  Sports: {rec.get('sportsCategory', 'Unknown')}")
                print(f"  Event ID: {rec.get('_id', 'Unknown')}")
        except json.JSONDecodeError:
            print("Error parsing recommendations JSON")
            print(f"Raw output: {recommendations_json}")
    else:
        print("Usage: python test_user_by_id.py <user_id>")
        print("Example: python test_user_by_id.py 67ca8f335e3b5416eb593a73")

if __name__ == "__main__":
    main()