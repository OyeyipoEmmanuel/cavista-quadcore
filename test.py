import requests
import sys

try:
    print("Testing login endpoint...")
    r = requests.post('https://cavista-quadcore-7tj4.onrender.com/api/v1/auth/login/', json={'email': 'test@test.com', 'password': 'password'}, timeout=15)
    print('STATUS:', r.status_code)
    print('BODY:', r.text)
except Exception as e:
    print('ERROR:', str(e))
