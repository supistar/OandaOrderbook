# -*- encoding:utf8 -*-

import os
from model.oandapy import oandapy


class OrderBook(object):

    def get_latest_orderbook(self, instrument, period):
        oanda_token = os.environ.get('OANDA_TOKEN')
        oanda = oandapy.API(environment="practice", access_token=oanda_token)
        orders = oanda.get_orderbook(instrument=instrument)
        latest_time = max(x for x in orders.keys())
        order = orders[latest_time]
        order['time'] = latest_time
        return order
