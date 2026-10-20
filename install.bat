@echo off
call npm.cmd install "@supabase/supabase-js" stripe resend twilio react-day-picker date-fns react-big-calendar moment "@react-pdf/renderer" lucide-react class-variance-authority clsx tailwind-merge > install.log 2>&1
echo DONE
