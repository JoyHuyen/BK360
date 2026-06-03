import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/public.decorator';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly svc: ProjectsService) {}

  @Public()
  @Get()
  list() {
    return this.svc.list();
  }
}
