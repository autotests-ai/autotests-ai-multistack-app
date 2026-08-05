import { HttpException } from '@nestjs/common';

/** Every error in the contract is exactly `{"message": "..."}` — no Nest envelope. */
export class ApiException extends HttpException {
  constructor(status: number, message: string) {
    super({ message }, status);
  }
}
