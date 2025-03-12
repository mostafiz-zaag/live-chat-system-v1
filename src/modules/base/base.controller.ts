import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { BaseService } from 'src/modules/base/base.service';
import {
  API_PREFIX,
  API_SECURED_PREFIX,
} from '../../constants/project.constant';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Base')
@Controller()
export class BaseController {
  constructor(private readonly baseService: BaseService) {}

  @Get()
  getBaseData(@Res() res: Response) {
    return res.status(HttpStatus.OK).json(this.baseService.getBaseData());
  }

  @Get(`${API_PREFIX}`) // Handles GET requests to /base
  getAPIBaseData(@Res() res: Response) {
    // Correctly using res.status to send a JSON response
    return res.status(HttpStatus.OK).json(this.baseService.getAPIBaseData()); // Send JSON response
  }

  @Get(`${API_SECURED_PREFIX}/base`) // Handles GET requests to /base
  getSecuredAPIBaseData(@Res() res: Response) {
    // Correctly using res.status to send a JSON response
    return res
      .status(HttpStatus.OK)
      .json(this.baseService.getSecuredAPIBaseData()); // Send JSON response
  }
}
