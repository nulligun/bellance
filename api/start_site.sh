#!/bin/bash
  
cd /var/www/bellance2/api
/usr/bin/gunicorn3 -b 127.0.0.1:8070 rest:app
