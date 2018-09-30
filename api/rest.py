from flask import Flask, jsonify, request, make_response
from configobj import ConfigObj
from flask_cors import CORS
from sqlalchemy import create_engine, and_, or_
from sqlalchemy.orm import sessionmaker
from models import *
import logging
from pymongo import MongoClient
from decimal import Decimal
import datetime
import re

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

app = Flask(__name__)
CORS(app)
config = ConfigObj(".env")
engine = create_engine("mysql+mysqldb://%(database_user)s:%(database_password)s@%(database_host)s/%(database_name)s" % config, isolation_level="READ UNCOMMITTED", pool_recycle=4)
Session = sessionmaker()
Session.configure(bind=engine)
session = Session()


client = MongoClient('localhost', 27017)
db = client['trust-wallet']
transactions = db.transactions


def address_valid(address):
    if len(address) == 42:
        if address[0:2] == "0x":
            if re.match(r"^[a-f0-9]*$", address[2:]):
                return True
    return False


def download_transactions(address):
    date_updated = 0
    for t in transactions.find({"addresses": address.address}):
        if t['value'] != "0":
            fer = Transfer()
            fer.address = address
            fer.date_added = t['timeStamp']
            if t['from'] == address:
                div = Decimal(-1000000000000000000)
            else:
                div = Decimal(1000000000000000000)
            fer.amount = Decimal(t['value']) / div
            date_updated = t['timeStamp']
        session.add(fer)

    address.date_updated = date_updated
    address.state = AddressStateEnum.complete


@app.route('/balance_at_time', methods=["POST"])
def balance_at():
    res = {}
    req = request.get_json(force=True)

    if req['address'] is None:
        res['error'] = 'address is required'
    else:
        address = req['address'].lower()
        if not address_valid(address):
            res['error'] = 'address is not valid'
        elif req['dates'] is None:
            res['error'] = 'dates array is required'

    if 'error' not in res:
        dates = req['dates']
        address_rec = session.query(Address).filter_by(address=address).one_or_none()
        if address_rec is None:
            new_address = Address()
            new_address.address = address
            new_address.date_updated = 0
            new_address.state = AddressStateEnum.initializing
            session.add(new_address)
            try:
                session.commit()
            except:
                session.rollback()
                raise

            download_transactions(new_address)
            get_stats(res, new_address, dates)

            try:
                session.commit()
            except:
                session.rollback()
                raise
        else:
            if address_rec.state == AddressStateEnum.initializing:
                res['initializing'] = True
            else:
                stale = False
                for d in dates:
                    if address_rec.date_updated < d['timestamp']:
                        stale = True
                        break

                if stale:
                    transf = session.query(Transfer).filter_by(address=address_rec)
                    transf.delete(synchronize_session=False)
                    download_transactions(address_rec)

                    try:
                        session.commit()
                    except:
                        session.rollback()
                        raise

                get_stats(res, address_rec, dates)

            try:
                session.commit()
            except:
                session.rollback()
                raise

    return jsonify(res)


def get_stats(res, address, dates):
    res['dates'] = []
    for d in dates:
        timestamp = int(d['timestamp'])
        interval = int(d['interval'])

        entry = {"id": d['id']}
        t = session.query(func.sum(Transfer.amount).label("balance")).filter_by(address=address).filter(Transfer.date_added <= timestamp).one()
        d1 = session.query(func.sum(Transfer.amount).label("balance")).filter_by(address=address).filter(Transfer.date_added <= (timestamp - interval)).one()
        d2 = session.query(func.sum(Transfer.amount).label("balance")).filter_by(address=address).filter(Transfer.date_added <= timestamp).filter(Transfer.date_added >= (timestamp - interval)).filter(Transfer.amount > 0).one()
        d3 = session.query(func.sum(Transfer.amount).label("balance")).filter_by(address=address).filter(Transfer.date_added <= timestamp).filter(Transfer.date_added >= (timestamp - interval)).filter(Transfer.amount < 0).one()
        if t[0] is None:
            entry['balance'] = 0
        else:
            entry['balance'] = float(t[0])

        if d1[0] is None:
            entry['delta'] = 0
        else:
            entry['delta'] = float(t[0]) - float(d1[0])

        if d3[0] is None:
            entry['spent'] = 0
        else:
            entry['spent'] = abs(float(d3[0]))

        if d2[0] is None:
            entry['earned'] = 0
        else:
            entry['earned'] = float(d2[0])
        res['dates'].append(entry)


if __name__ == '__main__':
    app.run(debug=False)

