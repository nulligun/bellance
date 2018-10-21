#!/bin/bash
  
cd /var/www/bellance/api
/usr/bin/gunicorn3 -b 127.0.0.1:8070 rest:app
