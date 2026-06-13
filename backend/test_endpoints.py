import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

API_URL = "http://127.0.0.1:8000"
IMAGE_PATH = r"d:\FARAWAY\citizen-app\assets\images\icon.png"

def test_workflow():
    print("=== STARTING END-TO-END ENDPOINT TESTS ===")
    
    # 1. POST /report
    print("\n1. Testing POST /report...")
    with open(IMAGE_PATH, 'rb') as img:
        files = {'image': ('icon.png', img, 'image/png')}
        data = {
            'latitude': 12.971598,
            'longitude': 77.594562,
            'description': 'Verification test fire report'
        }
        response = requests.post(f"{API_URL}/report", files=files, data=data)
        
    print("Status Code:", response.status_code)
    if response.status_code != 201:
        print("Failed to submit report:", response.text)
        return
        
    res_data = response.json()
    print("Response JSON:", json.dumps(res_data, indent=2))
    incident_id = res_data.get("incident_id")
    print(f"Obtained Incident ID: {incident_id}")
    
    # 2. GET /incident/{id} (Citizen view — no severity/priority)
    print(f"\n2. Testing GET /incident/{incident_id}...")
    response = requests.get(f"{API_URL}/incident/{incident_id}")
    print("Status Code:", response.status_code)
    print("Response JSON:", json.dumps(response.json(), indent=2))
    
    # 3. GET /incidents (Dashboard view — full detail)
    print("\n3. Testing GET /incidents...")
    response = requests.get(f"{API_URL}/incidents")
    print("Status Code:", response.status_code)
    incidents = response.json()
    print(f"Total incidents stored: {len(incidents)}")
    if len(incidents) > 0:
        print("Last incident detail:")
        # Find the one we just created
        created_inc = [inc for inc in incidents if inc['id'] == incident_id]
        if created_inc:
            print(json.dumps(created_inc[0], indent=2))
        else:
            print("Created incident not found in list!")
            
    # 4. PATCH /incident/{id}/status (Dashboard updates status)
    print(f"\n4. Testing PATCH /incident/{incident_id}/status...")
    update_data = {"status": "Under Review"}
    response = requests.patch(f"{API_URL}/incident/{incident_id}/status", json=update_data)
    print("Status Code:", response.status_code)
    print("Response JSON:", json.dumps(response.json(), indent=2))
    
    # 5. GET /incident/{id} again to verify status updated
    print(f"\n5. Verifying status change via GET /incident/{incident_id}...")
    response = requests.get(f"{API_URL}/incident/{incident_id}")
    print("Status Code:", response.status_code)
    print("Response JSON:", json.dumps(response.json(), indent=2))
    
    print("\n=== ALL ENDPOINT TESTS COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    test_workflow()
