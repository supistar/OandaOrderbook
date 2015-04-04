#!/usr/bin/env python
# -*- coding: utf-8 -*-

import unittest

import sys
import os
sys.path.append(os.pardir)
import main


class SlackTestCase(unittest.TestCase):

    def setUp(self):
        self.app = main.app.test_client()

    def test_get(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(None, response.json)
        json = response.json
        self.assertEqual(json['response'], 'Hello World!')

    def test_get2(self):
        response = self.app.get('/view')
        self.assertEqual(response.status_code, 200)


if __name__ == '__main__':
    unittest.main()
