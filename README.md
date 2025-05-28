<img width="1169" alt="스크린샷 2025-05-28 오전 11 30 36" src="https://github.com/user-attachments/assets/c793f7be-a1a6-4c26-83eb-4932a62bb29a" />  

# hospital_kiosk
병원 대기 환자 관리 프로그램


- 제작 목적 : 명동 Y모 의원 재직 중 원내의 키오스크 시스템 개선을 위해 제작 
- 제작 기간 : 2025. 5. 4 ~ 2025. 5. 28
- 제작 인원 : 1명  

| 이름 | Github | 백엔드 | 프론트엔드 |
|-----|--|---|-----|
| 이다영  | https://github.com/verdantjuly | 전반  | 전반  |

- 특이 사항 : 동료 개발자(MTtankkeo)의 조언과 협조를 통해 CSS 부분 개선을 진행함. 

## 프로그램 환경

- 사용 기술  
Backend Language : Node.js
Backend Framework : Express  
Frontend Lauguage : Javascript
Database : SQLite3

- 사용 포트 : 3000

## 프로그램 기능 소개
1. 접수환자 입력
2. 1,2 진료실 이동
3. 보류 환자는 보류자 목록에서 확인 가능
4. 환자기 있는 줄 (row)를 더블클릭 할 시 수정창이 열림
5. 대기 30분 경과 시 폭탄 이모지가 하나씩 생성됨
6. 이니셜 관리를 통해 이니셜을 추가 제거 가능함 (색상코드는 원하는 색 + "색상코드" 라는 검색어를 구글링하면 나옴)

## 프로그램 설치 방법

본 프로그램은 현재 Windows 기준으로 설치 방법을 설명합니다.
MacOS에서 사용을 원하는 경우 kiosk.bat을 sh파일로 내용 변환 후 사용하시길 바랍니다. 

1. 운영체제에 맞는 Node.js 설치 (v22.16.0 권장)  
   https://nodejs.org/ko/download
2. 본 레포지토리의 전체 파일을 zip으로 다운로드
   초록색 <> Code 버튼 > Download ZIP
![스크린샷 2025-05-28 오전 11 25 38](https://github.com/user-attachments/assets/59eb83e8-0d49-41f4-a67f-58a22a424e01)
3. 바탕화면에 압축 해제 (이때 폴더의 이름은 hospital_kiosk 로 유지해 주십시오.)
4. 폴더 안의 kiosk.bat 파일을 바탕화면으로 빼내기 
5. kiosk.bat 더블 클릭

## 문제 해결

#### kiosk.bat을 더블클릭하였으나 서버가 제대로 열리지 않을 경우
- visual studio 설치
- git 설치
- visual studio에서 hospital_kiosk 폴더를 연다.
- 터미널을 git bash로 연다. (powershell으로 열면 안 된다.)
- node app.js 라는 명령어를 입력한다.
- 이때 서버가 잘 작동하면 전체 코드가 아닌 kiosk.bat에서 해당 경로를 못 찾는 것 뿐입니다.
- 새로운 bat 파일을 작성해 주시거나 어려운 경우, 개발자의 개인 연락처로 연락을 부탁드립니다.

#### 기타 문제 해결
- 명동 Y모 의원 : 개발자의 개인 연락처로 문의바랍니다.
- 기타 사용처 : 본 레포지토리에 issue를 제기하기 바랍니다.

