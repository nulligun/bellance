from flask import Flask, jsonify, request, make_response
from configobj import ConfigObj
from flask_cors import CORS
from sqlalchemy import create_engine, and_, or_
from sqlalchemy.orm import sessionmaker
from models import *
import logging
from decimal import Decimal
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
        address_rec = session.query(Address).filter_by(address=address).one_or_none()
        if address_rec is None:
            res['error'] = 'address not found'
        else:
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
        t = session.query(func.sum(Balance.delta).label("balance")).filter_by(address=address).filter(Balance.balance_date <= timestamp).one()
        d1 = session.query(func.sum(Balance.delta).label("balance")).filter_by(address=address).filter(Balance.balance_date <= (timestamp - interval)).one()
        d2 = session.query(func.sum(Balance.delta).label("balance")).filter_by(address=address).filter(Balance.balance_date <= timestamp).filter(Balance.balance_date >= (timestamp - interval)).filter(Balance.delta > 0).one()
        d3 = session.query(func.sum(Balance.delta).label("balance")).filter_by(address=address).filter(Balance.balance_date <= timestamp).filter(Balance.balance_date >= (timestamp - interval)).filter(Balance.delta < 0).one()
        if t[0] is None:
            entry['balance'] = 0
        else:
            entry['balance'] = float(Decimal(t[0]) / Decimal(1000000000000000000))

        if d1[0] is None:
            entry['delta'] = 0
        else:
            entry['delta'] = float(Decimal(t[0]) / Decimal(1000000000000000000)) - float(Decimal(d1[0]) / Decimal(1000000000000000000))

        if d3[0] is None:
            entry['spent'] = 0
        else:
            entry['spent'] = abs(float(Decimal(d3[0]) / Decimal(1000000000000000000)))

        if d2[0] is None:
            entry['earned'] = 0
        else:
            entry['earned'] = float(Decimal(d2[0]) / Decimal(1000000000000000000))
        res['dates'].append(entry)


if __name__ == '__main__':
    app.run(debug=False)

