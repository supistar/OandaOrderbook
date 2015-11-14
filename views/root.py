# -*- encoding:utf8 -*-

from flask import Blueprint, render_template
from flask.ext.cors import cross_origin

root = Blueprint('root', __name__)


@root.route('/view', methods=['GET'])
@cross_origin()
def view():
    return render_template('view.html')
