#!/usr/bin/python3
"""
Module 1-fifo_cache.py
"""
from base_caching import BaseCaching
from collections import deque


class FIFOCache(BaseCaching):
    """
    FIFO Cache class that inherits from
    BaseCaching and implements
    a FIFO caching system.
    """

    def __init__(self):
        """initializes the class"""
        super().__init__()
        self.queue = deque([])

    def put(self, key, item):
        """Add an item in the cache
        """
        if key and item:
            if len(self.cache_data) == BaseCaching.MAX_ITEMS\
                    and key not in self.queue:
                del_key = self.queue.popleft()
                del self.cache_data[del_key]
                print("DISCARD: {}".format(del_key))
            self.cache_data[key] = item
            self.queue.append(key)

    def get(self, key):
        """Get an item by key
        """
        value = self.cache_data.get(key)
        return value
