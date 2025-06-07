import requests
import sys

# Fetch events data
def fetch_events():
    url = "http://localhost:5000/api/admin/events"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        print(f"Fetched {len(data['events'])} events", file=sys.stderr)
        return data["events"]
    else:
        raise Exception(f"Failed to fetch events: {response.status_code}")

# Fetch users data
def fetch_users():
    url = "http://localhost:5000/api/admin/users/getAllUsers"
    response = requests.get(url)
    if response.status_code == 200:
        users = response.json()["users"]
        print(f"Fetched {len(users)} users", file=sys.stderr)
        return users
    else:
        raise Exception(f"Failed to fetch users: {response.status_code}")