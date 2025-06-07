import requests
import json

def fetch_users():
    """Fetch users from the API and display their IDs and sports interests"""
    url = "http://localhost:5000/api/admin/users/getAllUsers"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            users = response.json()["users"]
            print(f"Found {len(users)} users")
            
            # Display users with their IDs and sports interests
            print("\nUsers with sports interests:")
            print("-" * 80)
            print(f"{'User ID':<30} {'Name':<30} {'Sports Interests':<30}")
            print("-" * 80)
            
            for user in users:
                user_id = user.get("_id", "No ID")
                name = user.get("fullname", "Unknown")
                sports = user.get("sports_interest", "None")
                
                print(f"{user_id:<30} {name:<30} {sports:<30}")
            
            print("\nTo generate recommendations for a specific user, run:")
            print("python Demo_Project_Backend/ml_recommendations/get_recommendations.py <user_id>")
            print("\nExample:")
            print(f"python Demo_Project_Backend/ml_recommendations/get_recommendations.py {users[0]['_id']}")
            
            return users
        else:
            print(f"Failed to fetch users: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        return []

if __name__ == "__main__":
    fetch_users()