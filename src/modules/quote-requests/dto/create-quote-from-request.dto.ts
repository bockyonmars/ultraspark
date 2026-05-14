import { PartialType } from '@nestjs/mapped-types';
import { CreateQuoteDto } from '../../quotes/dto/create-quote.dto';

export class CreateQuoteFromRequestDto extends PartialType(CreateQuoteDto) {}
