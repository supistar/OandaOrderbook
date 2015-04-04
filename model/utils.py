# -*- encoding:utf8 -*-

from flask import json, abort


class Utils(object):

    @classmethod
    def create_json(cls, cursor):
        count = cursor.rowcount
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        lists = []
        for row in rows:
            row = dict(zip(columns, row))
            lists.append(row)
        if count > 1:
            return lists
        else:
            return lists[0]

    @classmethod
    def dump_json(cls, dic, ensureAscii=False):
        return json.dumps(dic, sort_keys=True, ensure_ascii=ensureAscii)

    @classmethod
    def parse_dic(cls, dic, key, httpStatus=None):
        value = None
        if key in dic:
            value = dic[key]
        else:
            if (httpStatus):
                abort(httpStatus)
        return value

    @classmethod
    def transpose_orders(cls, dic):
        orders = []
        time = dic['time']
        rate = dic['rate']
        points = dic['price_points']
        for point in sorted(points):
            p = points[point]
            p['rate'] = point
            orders.append(p)
        result = {'orders': orders, 'time': time, 'rate': rate}
        return result
