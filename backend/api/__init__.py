"""HTTP routes. Each router owns one part of the public API."""

from fastapi import APIRouter

from backend.api import bench, builds, gsi, matches, system

router = APIRouter()
router.include_router(system.router)
router.include_router(matches.router)
router.include_router(builds.router)
router.include_router(bench.router)
router.include_router(gsi.router)
