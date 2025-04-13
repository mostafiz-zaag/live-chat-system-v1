import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { PageRequest } from 'src/common/dto/page-request.dto';
import { API_SECURED_PREFIX } from 'src/constants/project.constant';
import { Role } from 'src/enums/user-role';
import { FaqService } from './faq.service';

@Controller(`${API_SECURED_PREFIX}/faqs`)
export class FaqController {
    constructor(private readonly faqService: FaqService) {}

    @Post(`/create`)
    async createFAQ(@Body('sentence') sentence: string) {
        return await this.faqService.createFAQ(sentence);
    }

    @Delete(`/delete/:id`)
    async deleteFAQ(@Param('id') id: number) {
        return await this.faqService.deleteFAQ(+id);
    }

    @Patch('/update')
    async updateOwnFaqSentence(
        @Query('id') id: number,
        @Body('sentence') sentence: string,
    ) {
        return this.faqService.updateOwnFaqSentence(id, sentence);
    }

    @Get('/all')
    async getAdminAndOwnAgentFaqs(
        @Query('sentence') sentence: string,
        @Query('self') self: boolean,
        @Query('page') page: number,
        @Query('size') size: number,
    ) {
        return await this.faqService.getAdminAndOwnAgentFaqs(
            sentence,
            self,
            new PageRequest(page, size),
        );
    }

    @Get(`/admin`)
    async getAdminFaqs(
        @Query('sentence') sentence: string,
        @Query('isActive') isActive: boolean,
        @Query('page') page: number,
        @Query('size') size: number,
    ) {
        return await this.faqService.getFaqsByRole(
            Role.ADMIN,
            sentence,
            isActive,
            new PageRequest(page, size),
        );
    }

    // @Get(`/agent`)
    // async getAgentFaqs() {
    //     return await this.faqService.getFaqsByLoggedInUser();
    // }

    @Patch('admin/update/status')
    async updateFAQStatus(
        @Query('id') id: number,
        @Query('isActive') status: boolean,
    ) {
        return this.faqService.updateIsActive(id, status);
    }
}
