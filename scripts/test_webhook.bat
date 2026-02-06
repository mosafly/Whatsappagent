@echo off
REM Script pour tester les webhooks n8n Bobotcho (Windows)
REM Usage: test_webhook.bat [test|prod] [message]

setlocal enabledelayedexpansion

REM Configuration
set WEBHOOK_TEST=https://n8n.srv1014720.hstgr.cloud/webhook-test/bobotcho-webhook
set WEBHOOK_PROD=https://n8n.srv1014720.hstgr.cloud/webhook/bobotcho-webhook

REM Vérification des arguments
if "%~1"=="" (
    echo Usage: %0 [test^|prod] [message]
    echo.
    echo Exemples:
    echo   %0 test "Bonjour, je veux des infos sur vos produits"
    echo   %0 prod "Quels sont vos prix ?"
    echo.
    echo Environnements:
    echo   test  : %WEBHOOK_TEST%
    echo   prod  : %WEBHOOK_PROD%
    exit /b 1
)

if "%~2"=="" (
    echo Usage: %0 [test^|prod] [message]
    echo Message manquant.
    exit /b 1
)

set ENVIRONMENT=%~1
set MESSAGE=%~2

REM Sélection du webhook selon l'environnement
if "%ENVIRONMENT%"=="test" (
    set WEBHOOK_URL=%WEBHOOK_TEST%
    set ENV_LABEL=TEST
) else if "%ENVIRONMENT%"=="prod" (
    set WEBHOOK_URL=%WEBHOOK_PROD%
    set ENV_LABEL=PRODUCTION
) else (
    echo Erreur: Environnement '%ENVIRONMENT%' invalide. Utilise 'test' ou 'prod'.
    exit /b 1
)

echo =================================
echo   Test Webhook Bobotcho n8n
echo =================================
echo Environnement: %ENV_LABEL%
echo Webhook: %WEBHOOK_URL%
echo Message: %MESSAGE
echo.

REM Création du timestamp
for /f "tokens=1-6 delims= " %%a in ('wmic os get localdatetime ^| find "."') do (
    set datetime=%%a
)
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%T%datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2%.%datetime:~15,3%Z

REM Données de test
set PHONE=+2250104278080

REM Création du payload JSON temporaire
set TEMP_FILE=%TEMP%\webhook_payload_%RANDOM%.json

(
echo {
echo   "id": "test-%RANDOM%",
echo   "conversation_id": "test-conversation-%RANDOM%",
echo   "shop_id": "00000000-0000-0000-0000-000000000000",
echo   "role": "customer",
echo   "content": "%MESSAGE%",
echo   "type": "text",
echo   "metadata": {},
echo   "created_at": "%TIMESTAMP%",
echo   "status": "queued",
echo   "error_message": null,
echo   "customer_phone": "%PHONE%",
echo   "shop_phone": null,
echo   "message_body": "%MESSAGE%",
echo   "twilio_sid": null,
echo   "direction": "inbound"
echo }
) > "%TEMP_FILE%"

echo Payload JSON:
type "%TEMP_FILE%"
echo.

REM Exécution de la requête curl
echo Envoi de la requete...
echo.

curl -s -w "HTTP_STATUS:%%{http_code}" -X POST -H "Content-Type: application/json" -d @"%TEMP_FILE%" "%WEBHOOK_URL%" > %TEMP%\response.txt 2>&1

REM Lecture de la réponse
set /p RESPONSE=<%TEMP%\response.txt

REM Extraction du statut HTTP (simplifié)
for /f "tokens=*" %%i in ('echo "%RESPONSE%" ^| findstr /r "HTTP_STATUS:[0-9]*"') do (
    set HTTP_LINE=%%i
)

set HTTP_STATUS=%HTTP_LINE:HTTP_STATUS:=%

REM Affichage des résultats
echo Statut HTTP: %HTTP_STATUS%
echo.

if "%HTTP_STATUS%"=="200" (
    echo ✅ Succes !
) else if "%HTTP_STATUS%"=="201" (
    echo ✅ Succes !
) else (
    echo ❌ Erreur !
)

echo Reponse:
echo "%RESPONSE%" | findstr /v "HTTP_STATUS:"
echo.

REM Nettoyage
del "%TEMP_FILE%" 2>nul
del "%TEMP%\response.txt" 2>nul

echo =================================
echo            Test termine
echo =================================
