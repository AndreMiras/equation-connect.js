#!/usr/bin/env python
import os
import pyrebase
from pprint import pprint

config = {
  "apiKey": "AIzaSyDfqBq3AfIg1wPjuHse3eiXqeDIxnhvp6U",
  "authDomain": "oem1-elife-cloud-prod.firebaseapp.com",
  "databaseURL": "https://oem2-elife-cloud-prod-default-rtdb.firebaseio.com",
  "projectId": "oem2-elife-cloud-prod",
  "storageBucket": "oem2-elife-cloud-prod.appspot.com",
  "appId": "1:150904115315:android:03aeef2c831bbda0061a06",
}


def main():
    firebase = pyrebase.initialize_app(config)
    # Get a reference to the database service
    db = firebase.database()
    # Get a reference to the auth service
    auth = firebase.auth()
    email = os.environ.get('EMAIL')
    password = os.environ.get('PASSWORD')
    # Log the user in
    user = auth.sign_in_with_email_and_password(email, password)
    uid = user['localId']
    installations = db.child("/installations2") \
        .order_by_child("userid") \
        .equal_to(uid) \
        .get(token=user['idToken']) \
        .val()
    pprint(installations)

if __name__ == "__main__":
    main()
