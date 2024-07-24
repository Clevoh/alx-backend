#!/usr/bin/python3
"""
Module 3-lru_cache.py
"""
from base_caching import BaseCaching


class LRUCache(BaseCaching):
    """
    LRUCache class that inherits from BaseCaching
    and implements an LRU caching system.
    """

    def __init__(self):
        """initializes the class"""
        super().__init__()
        self.keys = []

    def put(self, key, item):
        """Add an item in the cache
        """
        if key and item:
            if len(self.cache_data) == BaseCaching.MAX_ITEMS\
                    and key not in self.keys:
                del_key = self.keys.pop(0)
                del self.cache_data[del_key]
                print("DISCARD: {}".format(del_key))
            if key in self.keys:
                self.keys.remove(key)
            self.cache_data[key] = item
            self.keys.append(key)

    def get(self, key):
        """Get an item by key
        """
        if key in self.keys:
            self.keys.remove(key)
            self.keys.append(key)
        value = self.cache_data.get(key)
        return value
