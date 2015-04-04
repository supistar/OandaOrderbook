# -*- encoding:utf8 -*-

from flask import Blueprint, render_template, redirect, url_for, request, current_app
from flask.ext.cors import cross_origin
from model.orderbook import OrderBook
from model.utils import Utils

root = Blueprint('root', __name__)


@root.route('/')
def roots():
    redirect_uri = url_for('view')
    return redirect(redirect_uri)


@root.route('/view', methods=['GET'])
@cross_origin()
def view():
    params = request.args
    instrument = params.get('instrument')
    if not instrument:
        instrument = 'USD_JPY'
    period = params.get('period')
    if not period:
        period = 3600
    orders = OrderBook().get_latest_orderbook(instrument=instrument, period=period)
    orders = Utils().transpose_orders(orders)
    current_app.logger.debug("Response : %r" % Utils().dump_json(orders))
    return render_template('view.html', orders=Utils().dump_json(orders))
