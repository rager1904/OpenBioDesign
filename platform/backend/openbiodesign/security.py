from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from openbiodesign.api.dependencies import get_identity_repository
from openbiodesign.domain.identity import ROLE_ORDER, Principal, Role
from openbiodesign.infrastructure.repositories import IdentityRepository

bearer_scheme = HTTPBearer(auto_error=False)
BEARER_CREDENTIALS = Depends(bearer_scheme)
IDENTITY_REPOSITORY = Depends(get_identity_repository)


def authenticate(
    credentials: HTTPAuthorizationCredentials | None = BEARER_CREDENTIALS,
    identity_repository: IdentityRepository = IDENTITY_REPOSITORY,
) -> Principal:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )

    principal = identity_repository.authenticate_api_key(credentials.credentials)
    if principal is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token.",
        )

    return principal


AUTHENTICATED_PRINCIPAL = Depends(authenticate)


def require_role(required_role: Role) -> Callable[[Principal], Principal]:
    def dependency(principal: Principal = AUTHENTICATED_PRINCIPAL) -> Principal:
        if ROLE_ORDER[principal.role] < ROLE_ORDER[required_role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role {required_role}.",
            )
        return principal

    return dependency
