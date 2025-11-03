# GSI Data Structure Documentation

## Overview

This document explains the structure of Game State Integration (GSI) data received from Dota Underlords.

## Terminology

- **DATA** = the received GSI payload (a single root object)
- **block** = the key in the received DATA object whose value is an array
- **block object** = each element in the "block" array
- **data** = the key inside block objects (only some block objects have this key)
- **data array** = the array value of the "data" key inside a block object
- **data object** = each element in a "data" array (contains either `public_player_state` or `private_player_state`)

## Structure

```
{                                 // GSI DATA - single root object
  "block": [                      // "block" key - value is an ARRAY
    {                             // Block object #1 (has "data" key - we PROCESS this)
      "data": [                   // "data" array - contains data objects
        { "public_player_state": {...} },
        { "public_player_state": {...} },
        ...
        { "private_player_state": {...} }
      ]
    },
    {                             // Block object #2 (has "data" key - we PROCESS this)
      "data": [...]
    },
    {                             // Block object #3 (NO "data" key - we SKIP this)
      // other keys, irrelevant to us
    },
    {                             // Block object #4 (has "data" key - we PROCESS this)
      "data": [...]
    },
    ...                           // Many more block objects
  ]
}
```

## Key Characteristics

1. **GSI DATA is a single root object** - The entire payload is one JSON object

2. **Single "block" key** - The root object contains exactly one key: `"block"`

3. **Block array contains many objects** - The "block" array can contain hundreds of block objects

4. **Only some block objects are relevant** - We are ONLY interested in block objects that contain the `"data"` key
   - Block objects without `"data"` key are skipped
   - Usually there are MULTIPLE block objects with `"data"` keys, and we process ALL of them

5. **Data arrays contain player states** - Each `"data"` array contains multiple data objects with either:
   - `public_player_state` - Multiple per data array (one for each player in the match)
   - `private_player_state` - Typically one per data array (client owner's private data)

6. **Data objects may be irrelevant** - Data objects within a `"data"` array that don't have either `public_player_state` or `private_player_state` should be skipped

## Processing Flow

When processing GSI DATA:

1. Access the `"block"` array: `data['block']`
2. Iterate through each block object in the array
3. For each block object:
   - Check if it has a `"data"` key
   - If no `"data"` key: skip this block object
   - If `"data"` key exists: process the `"data"` array
4. For each `"data"` array:
   - Iterate through each data object
   - Process objects with `private_player_state` first
   - Then process objects with `public_player_state`
   - Skip data objects that have neither

## Example

```json
{
  "block": [
    {
      "data": [
        {
          "public_player_state": {
            "account_id": 123456789,
            "health": 95,
            "gold": 15,
            "level": 4,
            ...
          }
        },
        {
          "public_player_state": {
            "account_id": 987654321,
            "health": 80,
            "gold": 20,
            "level": 5,
            ...
          }
        },
        {
          "private_player_state": {
            "shop_units": [...],
            "shop_locked": false,
            "reroll_cost": 2,
            ...
          }
        }
      ]
    },
    {
      "data": [
        {
          "public_player_state": {
            "account_id": 111222333,
            ...
          }
        }
      ]
    }
  ]
}
```

In this example:
- There are 2 block objects in the `"block"` array
- Both block objects have `"data"` keys, so both are processed
- The first block's `"data"` array contains 3 data objects (2 public, 1 private)
- The second block's `"data"` array contains 1 data object (1 public)

