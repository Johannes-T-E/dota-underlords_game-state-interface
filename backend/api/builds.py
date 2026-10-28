"""Saved board composition endpoints."""

import json

from fastapi import APIRouter, Body

from backend.domain.game_state import db
from backend.api.responses import error

router = APIRouter(prefix='/api/builds', tags=['builds'])


@router.get('')
def get_builds():
    return {'status': 'ok', 'builds': db.get_all_builds()}


@router.get('/{build_id}')
def get_build(build_id: str):
    build = db.get_build(build_id)
    if build is None:
        return error('Build not found', 404)
    return {'status': 'ok', 'build': build}


@router.post('', status_code=201)
def create_build(data: dict | None = Body(default=None)):
    if not data:
        return error('No data provided', 400)

    build_id = data.get('id')
    name = data.get('name')
    if not build_id or not name:
        return error('Missing required fields: id, name', 400)
    if db.get_build(build_id):
        return error(f'Build with ID "{build_id}" already exists', 409)

    db.save_build(build_id, name, data.get('description'), json.dumps(data.get('units', [])))
    return {'status': 'ok', 'message': 'Build created successfully'}


@router.put('/{build_id}')
def update_build(build_id: str, data: dict | None = Body(default=None)):
    if not data:
        return error('No data provided', 400)
    if not data.get('name'):
        return error('Missing required field: name', 400)
    if not db.get_build(build_id):
        return error('Build not found', 404)

    db.save_build(build_id, data['name'], data.get('description'), json.dumps(data.get('units', [])))
    return {'status': 'ok', 'message': 'Build updated successfully'}


@router.delete('/{build_id}')
def delete_build(build_id: str):
    if not db.delete_build(build_id):
        return error('Build not found', 404)
    return {'status': 'ok', 'message': 'Build deleted successfully'}
