'use strict';
import 'react-native-gesture-handler';
import Moment from 'react-moment';
import 'moment-timezone';
import React, {Component, Fragment, useEffect, useState} from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
  Button,
} from 'react-native';

import QRCodeScanner from 'react-native-qrcode-scanner';
import {RNCamera} from 'react-native-camera';
import moment from 'moment-timezone';
import {color} from 'react-native-reanimated';

const ScanScreen = () => {
  const [email, setEmail] = useState(null); //email 담아서 fetch(post)때 쓸라고
  const [users, setUsers] = useState([]); //memberData 에서 user정보 받기 위함
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phone_num, setPhone_num] = useState(null);
  const [scanned, setScanned] = useState(false);
  const API_URL = 'http://163.152.223.34:8000/';

  const onSuccess = e => {
    console.log('before setEmail:', e.data);
    setEmail(e.data.replace('.ac.kr', '').toString()); //ac.kr 꼴 삭제 --> 장고에서 @korea.ac.kr 꼴 인식 못함(http://163.152.223.34:8000/MemberData/cxz3619@korea일떄나 개인 페이지 인식가능 )
    scanned ? setScanned(false) : setScanned(true); //큐알 인식시 state 바꿔주기
  };
  // 스캐너 초기화  부분 퍼온 코드임
  let scanner;

  const startScan = () => {
    if (scanner) {
      scanner._setScanning(false);
    }
  };
  // 스캐너 초기화  부분 퍼온 코드임

  useEffect(() => {
    try {
      console.log('type of email:', typeof email);
      console.log(API_URL + 'memberData/' + email.replace('"', ''));
      fetch(API_URL + 'memberData/' + email.replace(/\"/gi, '')) //qr 인식시 큰따옴표 삭제 , 전체 MeberData에 get(정보있는지,없을때도 예외처리 해줘야 함)
        .then(response => response.json())
        .then(data => {
          setUsers(data);
          console.log('data.phnoe_num:', data.phone_num);
          setPhone_num(data.phone_num);
          console.log(phone_num);
          setLoading(false);
          console.log('user:', users);
          var time = new Date();
          try {
            fetch(API_URL + 'liveData/', {
              // MemberData에 있는 정보로 liveData(실시간인원 post)
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phone_num: data.phone_num,
                name: data.name,
                major: data.major,
                student_num: data.student_num,
                enter_time: moment().format('YYYY-MM-D HH:mm:ss'),
                reserve_product: data.reserve_product,
              }),
            })
              .then(response => response.json())
              .then(data_live => {
                console.log(
                  "API_URL+'liveData/'+phone_num:",
                  API_URL + 'liveData/' + phone_num,
                );
                if (
                  Object.entries(data_live).toString() ==
                  'phone_num,live data with this phone num already exists.'
                ) {
                  // 이미 있는 정보면 저런식으로 반환값이 옴
                  fetch(API_URL + 'liveData/' + phone_num + '/', {
                    method: 'DELETE',
                  })
                    .then(response => response.json())
                    .then(data => console.log('Delete_livdData_data:', data))
                    .catch(error =>
                      console.log('Delete_livdData_error:', error),
                    );
                }

                if (data.phone_num) {
                  // 코로나 기록 테이블로 전송(출입할때 마다)
                  //covid 실행
                  console.log(API_URL + 'covidRecord/');
                  fetch(API_URL + 'covidRecord/', {
                    method: 'POST',
                    headers: {
                      Accept: 'application/json',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      phone_num: data.phone_num,
                      name: data.name,
                      major: data.major,
                      student_num: data.student_num,
                      enter_time: moment().format('YYYY-MM-D HH:mm:ss'),
                    }),
                  })
                    .then(response => response.json())
                    .then(data => console.log('covid_data:', data))
                    .catch(error => console.log('covid_error:', error));
                  //covid
                }
              })
              .catch(error => console.log('liveData_data_Input_error:', error));
          } catch (e) {
            setError(e);
            console.log('liveData 접속 error:', error);
          }
        });
    } catch (e) {
      setError(e);
      console.log('db접속 error:', error);
    }
  }, [scanned]);

  return (
    <Fragment>
      <QRCodeScanner
        ref={camera => (scanner = camera)} // qr스캐너 초기화 할떄 쓰는 코드던데 잘은 모름;;;
        onRead={e => onSuccess(e)} //QR코드 읽으면 어떤 함수 실행할지
        showMarker={true} //리더기에 초록색 사각형
        topContent={
          <Text style={styles.centerText}>
            {' '}
            {/* 위에 글자들 */}
            <Text> {JSON.stringify(users.email)} </Text>
            <Text>
              {' '}
              {JSON.stringify(users.name)},{JSON.stringify(users.major)}{' '}
            </Text>
          </Text>
        }
        bottomContent={
          <Button title="Reactivate" onPress={() => startScan()} />
        }
        style={{flex: 1}}
      />
    </Fragment>
  );
};

const styles = StyleSheet.create({
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
});

AppRegistry.registerComponent('default', () => ScanScreen);

export default ScanScreen;

{
  /*
 render() {
    return (
      
      
     <Fragment>
        <QRCodeScanner
        //onRead={(e)=>Alert.alert("scaned",e.data,this.state.count,this.update)}//인식 성공하면 여기서 받은 정보를 서버로 보내든가 해야함
        
        onRead={this.onSuccess}
             //큐알 재인식?
        
        showMarker={true}   // 초록색 선
        topContent={//위에 단어
          <Text style={styles.centerText}>
           QR코드 읽기
          </Text>
        }
        bottomContent={ //밑에 단어
          <TouchableOpacity style={styles.buttonTouchable}>
            <Text style={styles.buttonText}>OK. Got it!</Text>
          </TouchableOpacity>
        }
        
      />
       <Button title="reactivate"
   onPress={() => {
    this.scanner.reactivate();
       
      }}  />
      
      

     </Fragment>
    );}*/
}