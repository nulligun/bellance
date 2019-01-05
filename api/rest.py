from flask import Flask, jsonify, request, make_response
from configobj import ConfigObj
from flask_cors import CORS
from sqlalchemy import create_engine, and_, or_
from sqlalchemy.orm import sessionmaker, scoped_session
from models import *
import datetime
import logging
from decimal import Decimal
import re

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

app = Flask(__name__)
CORS(app)
config = ConfigObj(".env")
engine = create_engine("mysql+mysqldb://%(database_user)s:%(database_password)s@%(database_host)s/%(database_name)s" % config, isolation_level="READ UNCOMMITTED", pool_recycle=4)
engine2 = create_engine("mysql+mysqldb://%(database_user)s:%(database_password)s@%(database_host)s/%(database_name)s" % config, isolation_level="READ UNCOMMITTED", pool_recycle=4)
session_factory = sessionmaker(bind=engine)
session_factory2 = sessionmaker(bind=engine2)
Session = scoped_session(session_factory=session_factory)
Session2 = scoped_session(session_factory=session_factory2)

ERROR_ADDRESS_REQUIRED = 1
ERROR_ADDRESS_INVALID = 2
WARNING_ADDRESS_CHECKSUM = 3
ERROR_DATES_REQUIRED = 4
ERROR_ADDRESS_NOT_FOUND = 5


def address_valid(address):
    if len(address) == 42:
        if address[0:2] == "0x":
            if re.match(r"^[a-f0-9]*$", address[2:]):
                return True
    return False


@app.route('/validate_address', methods=["POST"])
def validate_address():
    res = {}
    req = request.get_json(force=True)
    if req['address'] is None:
        res['error'] = ERROR_ADDRESS_REQUIRED
        res['message'] = 'Address is required'
    else:
        address = req['address'].lower().strip()
        if not address_valid(address):
            res['error'] = ERROR_ADDRESS_INVALID
            res['message'] = 'Address is not valid'
        else:
            address_rec = Session.query(Address).filter_by(address=address).one_or_none()
            if address_rec is None:
                res['error'] = ERROR_ADDRESS_NOT_FOUND
                res['message'] = 'Address was not found'
            else:
                v = Session2.query(StatusVariables).filter_by(id='last_rich_list_build').one()
                if v.value + 300 < datetime.datetime.now().timestamp():
                    Session2.query(RichListEntry).delete()
                    engine2.execute("insert into rich_list_entry (id, address_id, rank) select null, address_id, @curRank := @curRank + 1 AS rank from (select address_id, sum(delta) sd from balances b group by address_id having sd > 1000000000000000000 order by sd desc) b, (select @curRank := 0) r")
                    v.value = datetime.datetime.now().timestamp()
                    try:
                        Session2.commit()
                    except:
                        Session2.rollback()
                        raise

                c = Session2.query(func.count(RichListEntry.id)).one()
                res['total'] = c[0]

                rank = Session2.query(RichListEntry).filter_by(address=address_rec).one_or_none()
                if rank is not None:
                    res['rank'] = rank.rank
                else:
                    res['rank'] = 0

    try:
        Session.commit()
    except:
        Session.rollback()
        raise

    try:
        Session2.commit()
    except:
        Session2.rollback()
        raise

    return jsonify(res)


@app.route('/circulating_supply', methods=["GET"])
def circulating_supply():
    balance = Session.query(func.sum(Balance.delta).label("balance")).one()
    if request.args.get('decimal') is not None:
        b = balance[0] / Decimal(1000000000000000000)
    else:
        b = balance[0]
    return str(b)


@app.route('/balance_at_time', methods=["POST"])
def balance_at():
    res = {}
    req = request.get_json(force=True)

    if req['address'] is None:
        res['error'] = ERROR_ADDRESS_REQUIRED
    else:
        address = req['address'].lower()
        if not address_valid(address):
            res['error'] = ERROR_ADDRESS_INVALID
        elif req['dates'] is None:
            res['error'] = ERROR_DATES_REQUIRED

    if 'error' not in res:
        dates = req['dates']
        address_rec = Session.query(Address).filter_by(address=address).one_or_none()
        if address_rec is None:
            res['error'] = ERROR_ADDRESS_NOT_FOUND
        else:
            get_stats(res, address_rec, dates)

    try:
        Session.commit()
    except:
        Session.rollback()
        raise

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

