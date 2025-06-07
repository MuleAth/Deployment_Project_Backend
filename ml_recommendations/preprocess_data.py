import pandas as pd
import sys
import json

def normalize_list_or_string(value):
    """
    Normalize input that could be a string, list, or JSON string to a list of strings
    Enhanced to handle react-select format (comma-separated values from multi-select)
    """
    normalized = []
    
    # Handle empty values
    if not value:
        return normalized
        
    # Handle JSON strings (from frontend)
    if isinstance(value, str) and (value.startswith('[') and value.endswith(']')):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                # Successfully parsed JSON array
                for item in parsed:
                    if item and isinstance(item, str):
                        normalized.append(item.strip().lower())
                    elif item and isinstance(item, dict) and 'value' in item:
                        # Handle react-select format: {value: 'football', label: 'Football'}
                        normalized.append(item['value'].strip().lower())
                return normalized
        except json.JSONDecodeError:
            # Not valid JSON, continue with normal string processing
            pass
    
    # Handle regular strings (comma-separated)
    if isinstance(value, str):
        # Split by comma and clean up each item
        items = [item.strip().lower() for item in value.split(',') if item.strip()]
        normalized.extend(items)
    
    # Handle lists/arrays
    elif isinstance(value, (list, tuple)):
        for item in value:
            if isinstance(item, str) and item.strip():
                normalized.append(item.strip().lower())
            elif isinstance(item, dict) and 'value' in item:
                # Handle react-select format: {value: 'football', label: 'Football'}
                normalized.append(item['value'].strip().lower())
            elif item:  # Handle non-string items by converting to string
                normalized.append(str(item).strip().lower())
    
    return normalized

def preprocess_users(users):
    """Process user data with proper type handling for both string and list inputs"""
    processed = []
    for user in users:
        try:
            # Get sports interests and normalize to a consistent format
            raw_interests = user.get("sports_interest", "")
            
            # Try alternate field names if primary field is empty
            if not raw_interests:
                raw_interests = user.get("sportsInterest", "")
            
            # Normalize to list format
            interests = normalize_list_or_string(raw_interests)
            
            # Add the original combined string as an interest for better matching
            if len(interests) > 1:
                combined_interest = ",".join(interests)
                if combined_interest not in interests:
                    interests.append(combined_interest)
            
            # Ensure all interests are strings
            interests = [str(interest) for interest in interests if interest]
            
            # Only include users with sports interests
            if interests:
                processed.append({
                    "_id": str(user["_id"]),
                    "fullname": user.get("fullname", "Unknown User"),
                    "email": user.get("email", ""),
                    "mobile_number": user.get("mobile_number", ""),
                    "sports_interest": tuple(interests),
                    "sports_interest_str": " ".join(interests)  # Add string version for easier matching
                })
                print(f"User {user.get('fullname', 'Unknown')} interests: {interests}", file=sys.stderr)
        except Exception as e:
            print(f"Error processing user {user.get('fullname', 'Unknown')}: {str(e)}", file=sys.stderr)
            # Add a minimal version of the user to avoid losing data
            processed.append({
                "_id": str(user["_id"]),
                "fullname": user.get("fullname", "Unknown User"),
                "email": user.get("email", ""),
                "mobile_number": user.get("mobile_number", ""),
                "sports_interest": tuple(),
                "sports_interest_str": ""
            })

    print(f"Processed {len(processed)} users with sports interests", file=sys.stderr)
    return pd.DataFrame(processed)

def preprocess_events(events):
    """Process event data with consistent formatting for both string and list inputs"""
    processed = []
    for event in events:
        try:
            # Get sports categories and normalize to a consistent format
            raw_categories = event.get("sportsCategory", "")
            
            # Normalize to list format
            categories = normalize_list_or_string(raw_categories)
            
            # Store the original combined string for better matching
            original_category = ",".join(categories) if categories else ""
            
            # Add the original string as a category if it contains multiple categories
            if len(categories) > 1 and original_category not in categories:
                categories.append(original_category)

            # Ensure all categories are strings
            categories = [str(cat) for cat in categories if cat]
            
            processed.append({
                "_id": str(event["_id"]),
                "title": event.get("title", "Untitled Event"),
                "sportsCategory": tuple(categories) if categories else tuple(),
                "sportsCategory_str": " ".join(categories),
                "original_category": original_category,
                "createdAt": event.get("createdAt", ""),
                "location": event.get("location", ""),
                "startDate": event.get("startDate", "")
            })
        except Exception as e:
            print(f"Error processing event {event.get('title', 'Unknown')}: {str(e)}", file=sys.stderr)
            # Add a minimal version of the event to avoid losing data
            processed.append({
                "_id": str(event["_id"]),
                "title": event.get("title", "Untitled Event"),
                "sportsCategory": tuple(),
                "sportsCategory_str": "",
                "original_category": "",
                "createdAt": event.get("createdAt", ""),
                "location": event.get("location", ""),
                "startDate": event.get("startDate", "")
            })
            print(f"Event {event.get('title', 'Untitled')} categories: {categories}", file=sys.stderr)
        except Exception as e:
            print(f"Error in print statement: {str(e)}", file=sys.stderr)

    print(f"Processed {len(processed)} events", file=sys.stderr)
    return pd.DataFrame(processed)