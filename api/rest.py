from flask import Flask, jsonify, request, make_response
from configobj import ConfigObj
from flask_cors import CORS
from sqlalchemy import create_engine, and_, or_
from sqlalchemy.orm import sessionmaker, scoped_session
from models import *
import logging
from decimal import Decimal
import re

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

app = Flask(__name__)
CORS(app)
config = ConfigObj(".env")
engine = create_engine("mysql+mysqldb://%(database_user)s:%(database_password)s@%(database_host)s/%(database_name)s" % config)
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)


def address_valid(address):
    if len(address) == 42:
        if address[0:2] == "0x":
            if re.match(r"^[a-f0-9]*$", address[2:]):
                return True
    return False


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
        address_rec = Session.query(Address).filter_by(address=address).one_or_none()
        if address_rec is None:
            res['error'] = 'address not found'
        else:
            get_stats(res, address_rec, dates)

    Session.remove()
    return jsonify(res)


def get_stats(res, address, dates):
    res['dates'] = []
    for d in dates:
        timestamp = int(d['timestamp'])
        interval = int(d['interval'])

        entry = {"id": d['id']}
        balance = Session.query(func.sum(Balance.delta).label("balance")).filter_by(address=address).filter(Balance.balance_date <= timestamp).one()
        delta = Session.query(func.sum(Balance.delta).label("delta")).filter_by(address=address).filter(Balance.balance_date <= (timestamp - interval)).one()
        earned = Session.query(func.sum(Balance.delta).label("spent")).filter_by(address=address).filter(Balance.balance_date <= timestamp).filter(Balance.balance_date > (timestamp - interval)).filter(Balance.delta > 0).one()
        spent = Session.query(func.sum(Balance.delta).label("earned")).filter_by(address=address).filter(Balance.balance_date <= timestamp).filter(Balance.balance_date > (timestamp - interval)).filter(Balance.delta < 0).one()

        stats = Session.query(DailyAggregate).filter(DailyAggregate.transaction_date <= timestamp).filter(DailyAggregate.transaction_date > (timestamp - interval)).one_or_none()

        if stats is None:
            entry['block'] = 0
            entry['difficulty'] = 0
            entry['transactions'] = 0
        else:
            entry['block'] = int(stats.block)
            entry['difficulty'] = str(stats.difficulty)
            entry['transactions'] = int(stats.transactions)

        # if last rich list was more than 5 mintues ago
        # build rich list
        # find rank in the rich list

        if balance[0] is None:
            entry['balance'] = 0
        else:
            entry['balance'] = float(Decimal(balance[0]) / Decimal(1000000000000000000))

        if delta[0] is None:
            if balance[0] is None:
                entry['delta'] = 0
            else:
                entry['delta'] = entry['balance']
        else:
            entry['delta'] = float(Decimal(balance[0]) / Decimal(1000000000000000000)) - float(Decimal(delta[0]) / Decimal(1000000000000000000))

        if spent[0] is None:
            entry['spent'] = 0
        else:
            entry['spent'] = abs(float(Decimal(spent[0]) / Decimal(1000000000000000000)))

        if earned[0] is None:
            entry['earned'] = 0
        else:
            entry['earned'] = float(Decimal(earned[0]) / Decimal(1000000000000000000))
        res['dates'].append(entry)


if __name__ == '__main__':
    app.run(debug=False)

