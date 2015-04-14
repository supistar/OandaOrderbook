# -*- encoding:utf8 -*-

import os
from model.oandapy import oandapy


class OrderBook(object):

    def get_latest_orderbook(self, instrument, period, history):
        oanda_token = os.environ.get('OANDA_TOKEN')
        oanda = oandapy.API(environment="practice", access_token=oanda_token)
        orders = oanda.get_orderbook(instrument=instrument)
        try:
            timeset = orders.keys()
            timeset.sort()
            timeset.reverse()
            target_time = timeset[history]
        except:
            return None
        order = orders[target_time]
        order['time'] = target_time
        return order
