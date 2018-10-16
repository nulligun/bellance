# Ellaism Historical Balance Tool

Choose a date or a date range from a calendar and see the daily balances in a list, graph or export to CSV.


## Front End

npm install
npm start

## Api

### Create MySQL Tables

Create a mysql user and place the credentials in a file name .env in the api folder.

```
database_host=localhost
database_name=funnel
database_user=funnel
database_password=funnel
```

Run `python3 create_tables.py` to create the tables.


### Running the Api Server

I recommend Gunicorn for running the api web server.  Edit `start_site.sh` to suit your environment and run it.  You can use pm2 to run it in the background.

You also need to run a back end that populates MySQL.  This can be found here at the [Ellaism Daily Balance Funnel](https://github.com/stevemulligan/daily-balance-funnel)