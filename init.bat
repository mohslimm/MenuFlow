@echo off
cd c:\Users\moham\Downloads\MenuFlow
call npx.cmd -y create-next-app@14 menuflow --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm > init.log 2>&1
xcopy /s /e /h /y /q menuflow\* . >> init.log 2>&1
rmdir /s /q menuflow
echo DONE >> init.log
