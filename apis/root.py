# -*- encoding:utf8 -*-

from flask import Blueprint, request, abort
from model.orderbook import OrderBook
from model.utils import Utils

api_root = Blueprint('api_root', __name__, url_prefix='/apis')


@api_root.route('/orders', methods=['POST'])
def orders():
    params = request.json
    instrument = params.get('instrument')
    history = params.get('history')
    period = params.get('period')
    if not instrument:
        instrument = 'USD_JPY'
    if not history:
        history = 0
    else:
        history = int(history)
    if not period:
        period = 3600
    orders = OrderBook().get_latest_orderbook(instrument=instrument, period=period, history=history)
    if not orders:
        abort(400)
    orders = Utils().transpose_orders(orders)
    return Utils().dump_json(orders)
