# Equation Connect Reverse Engineering

This is documenting my journey to reverse engineering the
[Equation Connect app](https://play.google.com/store/apps/details?id=com.equation.connect).
The goal was to be able to drive the radiators wirelessly without having to use the proprietary app.


## APK download & decompiling
The steps to decompile an APK are mainly described in this article:
[Reverse Engineering Sodexo's API](https://medium.com/@andre.miras/reverse-engineering-sodexos-api-d13710b7bf0d)

Here we summarize some of them.

- APK used: https://play.google.com/store/apps/details?id=com.equation.connect
- version: 1.1.7 (22 December 2020)

Assuming the APK is already loaded on the Android device, proceed as below to download on the computer.
Get the APK on device path:
```sh
adb shell pm list packages -f | grep equation
```
Output:
```
package:/data/app/com.equation.connect-o_YVszDVYUeUGXMs-sEYnw==/base.apk=com.equation.connect
```
Copy to the computer:
```sh
adb shell cp /data/app/com.equation.connect-o_YVszDVYUeUGXMs-sEYnw==/base.apk /sdcard/
adb pull /sdcard/base.apk .
```
Decompile:
```sh
jadx --output-dir base base.apk
```

## Looking into `strings.xml`
Often an interesting starting point point is the `base/resources/res/values/strings.xml` file.
This is an extract of the juicy part:
```xml
...
<string name="firebase_database_url">https://oem2-elife-cloud-prod-default-rtdb.firebaseio.com</string>
<string name="legal_advice_oem_url">https://oem1-elife-cloud-prod.firebaseapp.com</string>
...
<string name="google_api_key">AIzaSyDfqBq3AfIg1wPjuHse3eiXqeDIxnhvp6U</string>
<string name="google_app_id">1:150904115315:android:03aeef2c831bbda0061a06</string>
<string name="google_crash_reporting_api_key">AIzaSyDfqBq3AfIg1wPjuHse3eiXqeDIxnhvp6U</string>
<string name="google_storage_bucket">oem2-elife-cloud-prod.appspot.com</string>
...
```
Sounds like we already have the whole Firebase config, next up would be to find the different
endpoints used.

## Let's `grep` through the source
The APK source contains a lot of thirdparty code, but the actual application code is located in:
`base/sources/com/droiders/android/rointeconnect/`

Let's `grep` into it:
```sh
grep -ir firebase base/sources/com/droiders/android/rointeconnect/
```
We come across a lot of references, one of them is [RxFirebase](https://github.com/FrangSierra/RxFirebase),
the library used by the application.
Reading through the RxFirebase documentation helps to find the next string to `grep` for in order
to find some of the key endpoints.
```sh
cd base/sources/com/droiders/android/rointeconnect/
grep -r 'child("' .
```
Output extract:
```
./data/repository/rest/DeviceRepositoryImpl.java:        DatabaseReference child = instance.getReference().child("installations2");
./data/repository/rest/DeviceRepositoryImpl.java:        DatabaseReference child3 = child2.child(path).child("devices");
./data/repository/rest/DeviceRepositoryImpl.java:        DatabaseReference child = instance.getReference().child("devices").child(deviceId);
./data/repository/rest/DeviceRepositoryImpl.java:        DatabaseReference child = instance.getReference().child("devices").child(deviceModel.getId());
./data/repository/rest/DeviceRepositoryImpl.java:        DatabaseReference child = instance.getReference().child("devices").child(id).child(FNodeDevices.DATA).child("power");
./data/repository/rest/DeviceRepositoryImpl.java:        DatabaseReference child = instance.getReference().child("devices").child(id).child(FNodeDevices.DATA).child("temp");
./data/repository/rest/DeviceRepositoryImpl.java:        DatabaseReference child = instance.getReference().child("devices").child(deviceId).child(FNodeDevices.DATA);
./data/repository/rest/WarmUpRepositoryImpl.java:        DatabaseReference child = instance.getReference().child("devices").child(idDevice).child(FNodeDevices.DATA).child(FNodeDevices.NODE_TEMP_PROBE);
./data/repository/firebase/FirebaseInstallationRepository.java:        DatabaseReference child = instance.getReference().child("installations2").child(id);
./data/repository/firebase/FirebaseInstallationRepository.java:        Query equalTo = instance.getReference().child("installations2").orderByKey().equalTo(id);
./data/repository/firebase/FirebaseInstallationRepository.java:        Query equalTo = instance.getReference().child("installations2").orderByChild(FNodeInstallation.NODE_USER_ID).equalTo(userId);
./data/repository/firebase/FirebaseInstallationRepository.java:        DatabaseReference child = instance.getReference().child("installations2");
./data/repository/firebase/FirebaseInstallationRepository.java:        Query equalTo = instance.getReference().child("installations2").orderByChild(FNodeInstallation.NODE_USER_ID).equalTo(id);
./data/repository/firebase/FirebaseInstallationRepository.java:        DatabaseReference child = instance.getReference().child("installations2").child(id);
./data/repository/firebase/FirebaseZonesRepository.java:        DatabaseReference child2 = child.child(id).child("zones");
./data/repository/firebase/FirebaseZonesRepository.java:        DatabaseReference child3 = child2.child(path).child("devices").child(id);
```
More particularly some of these extracted lines from `FirebaseInstallationRepository.java` became our entry point:
```java
// ...
Query equalTo = instance.getReference().child("installations2").orderByKey().equalTo(id);
// ...
Query equalTo = instance.getReference().child("installations2").orderByChild(FNodeInstallation.NODE_USER_ID).equalTo(userId);
// ...
Query equalTo = instance.getReference().child("installations2").orderByChild(FNodeInstallation.NODE_USER_ID).equalTo(id);
// ...
```

## Scripting a proof of concept
Time to write a [proof of concept script](poc.py) to query the `installations2` endpoint.
The key part of the script is that line:
```python
installations = db.child("/installations2") \
    .order_by_child("userid") \
    .equal_to(uid) \
    .get(token=user['idToken']) \
    .val()
```
Running the script returned the following output:
```python
OrderedDict([('-NpGMwWcMOLGbIc6Vrqh',
        {'cost_limit': 0,
         'currency': 'EUR',
         'latitude': 48.858093,
         'location': "Paris, France",
         'longitude': 2.2946948925937999999998,
         'name': 'Home',
         'power': True,
         'timeZone': 1,
         'timeZoneId': 'Central Europe Standard Time',
         'userid': '4KvVlaW8x7CSHA5mhLNI2YNzbjQ3',
         'zones': {'-MpGOkgR4zExLBUDUafz': {'comfort': 20,
                          'devices': {'607DC56EB994607DC57EB994': True,
                                'D88DDF3A7F81D88DDF3A7D80': True,
                                'F9096F335FC4F9098F334FC4': True},
                          'eco': 16,
                          'final': True,
                          'ice_mode': False,
                          'id': '-MpGOkgR4zExLBUDUafz',
                          'last_device_id_update': '',
                          'legionella_conf': 0,
                          'meters': 0,
                          'mode': 'manual',
                          'name': 'Living room',
                          'path': '/zones/-MpGOkgR4zExLBUDUafz',
                          'pilot_mode': False,
                          'pir_mode': False,
                          'power': False,
                          'schedule': ['OOOOOOOOOOOOOOOOOOOOOOOO',
                                 'OOOOOOOOOOOOOOOOOOOOOOOO',
                                 'OOOOOOOOOOOOOOOOOOOOOOOO',
                                 'OOOOOOOOOOOOOOOOOOOOOOOO',
                                 'OOOOOOOOOOOOOOOOOOOOOOOO',
                                 'OOOOOOOOOOOOOOOOOOOOOOOO',
                                 'OOOOOOOOOOOOOOOOOOOOOOOO'],
                          'status': 'eco',
                          'temp': 16,
                          'two_hours': False,
                          'type': 'radiator',
                          'windows_open_mode': False},
             '-MrTN4ofVfNrOeW2Nd6N': {'comfort': 19,
                          'eco': 15,
                          'final': True,
                          'ice_mode': False,
                          'id': '-MrTN4ofVfNrOeW2Nd6N',
                          'last_device_id_update': '',
                          'legionella_conf': 0,
                          'meters': 0,
                          'mode': 'manual',
                          'name': 'Room 1',
                          'path': '/zones/-MrTN4ofVfNrOeW2Nd6N',
                          'pilot_mode': False,
                          'pir_mode': False,
                          'power': True,
                          'schedule': ['OOOOOOOOOOOOOOOOOOOOOOOO',
                                 'OOOOOOOOOOOOOOOOOOOOOOOO',
                                 'OOOOOOOOOOOOOOOOOOOOOOOO',
                                 'OOOOOOOOOOOOOOOOOOOOOOOO',
                                 'OOOOOOOOOOOOOOOOOOOOOOOO',
                                 'OOOOOOOOOOOOOOOOOOOOOOOO',
                                 'OOOOOOOOOOOOOOOOOOOOOOOO'],
                          'status': 'none',
                          'temp': 20,
                          'two_hours': False,
                          'type': 'unknow',
                          'windows_open_mode': False}}})])
```
Bingo!

## Conclusion
In a similar approach we got the following endpoints extracted:
- /users/:uid
- /installations
- /devices/:id
- /devices/:id/data
- more to come

All packed up into a library:
https://www.npmjs.com/package/equation-connect
