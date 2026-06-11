import { ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { applyDecorators } from '@nestjs/common'

import { ApiErrorDto } from '../dto/api-error.dto.js'

export function ApiStandardErrors() {
  return applyDecorators(ApiBadRequestResponse({ type: ApiErrorDto }), ApiUnauthorizedResponse({ type: ApiErrorDto }))
}
