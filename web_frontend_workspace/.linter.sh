#!/bin/bash
cd /home/kavia/workspace/code-generation/tvguideinsightbot-10232-976e0bbe/web_frontend_workspace/web_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

