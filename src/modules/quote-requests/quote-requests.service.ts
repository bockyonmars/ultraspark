import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  QuoteDocumentType,
  QuoteRequestStatus,
  QuoteStatus,
} from "@prisma/client";
import {
  assertRequiredFields,
  combineDetails,
  getNumberValue,
  getStringValue,
  PayloadRecord,
  splitFullName,
} from "../../common/utils/public-form-payload.util";
import { AnalyticsService } from "../analytics/analytics.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CustomersService } from "../customers/customers.service";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma.service";
import { QuotesService } from "../quotes/quotes.service";
import { CreateQuoteFromRequestDto } from "./dto/create-quote-from-request.dto";
import { ServicesService } from "../services/services.service";
import { CreateQuoteRequestDto } from "./dto/create-quote-request.dto";
import { UpdateQuoteRequestStatusDto } from "./dto/update-quote-request-status.dto";

@Injectable()
export class QuoteRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly servicesService: ServicesService,
    private readonly emailService: EmailService,
    private readonly analyticsService: AnalyticsService,
    private readonly auditLogsService: AuditLogsService,
    private readonly quotesService: QuotesService,
  ) {}

  async createPublic(payload: PayloadRecord) {
    const fullName = getStringValue(payload, ["fullName", "Full Name"]);
    const nameParts = splitFullName(fullName);
    const email = getStringValue(payload, ["email", "Email", "Email Address"]);
    const phone = getStringValue(payload, ["phone", "Phone Number"]);
    const address = getStringValue(payload, ["address", "Address"]);
    const additionalNotes = getStringValue(payload, [
      "additionalNotes",
      "Additional Notes",
    ]);
    const rawDetails = getStringValue(payload, [
      "details",
      "message",
      "Message",
    ]);

    assertRequiredFields(
      [
        { label: "fullName", value: fullName },
        { label: "address", value: address },
      ],
      "Quote submission is missing required fields",
    );

    if (!email && !phone) {
      throw new BadRequestException(
        "Quote submission requires an email or phone number",
      );
    }

    return this.create({
      firstName:
        getStringValue(payload, ["firstName"]) ?? nameParts.firstName ?? "N/A",
      lastName:
        getStringValue(payload, ["lastName"]) ?? nameParts.lastName ?? "N/A",
      email,
      phone,
      serviceId: getStringValue(payload, ["serviceId"]),
      serviceType: getStringValue(payload, ["serviceType", "Service Type"]),
      postcode: address,
      propertyType: getStringValue(payload, ["propertyType", "Property Type"]),
      bedrooms: getNumberValue(payload, ["bedrooms", "Bedrooms"]),
      bathrooms: getNumberValue(payload, ["bathrooms", "Bathrooms"]),
      preferredDate: getStringValue(payload, ["preferredDate", "date", "Date"]),
      details:
        combineDetails([
          address ? `Address: ${address}` : undefined,
          additionalNotes ? `Additional notes: ${additionalNotes}` : undefined,
          rawDetails,
        ]) || "Quote submitted from Framer form",
    });
  }

  async create(createDto: CreateQuoteRequestDto & { serviceType?: string }) {
    assertRequiredFields(
      [
        { label: "firstName", value: createDto.firstName },
        { label: "lastName", value: createDto.lastName ?? "N/A" },
        { label: "details", value: createDto.details },
      ],
      "Quote submission is missing required fields",
    );

    if (!createDto.email && !createDto.phone) {
      throw new BadRequestException("Email or phone is required");
    }

    let service = createDto.serviceId
      ? await this.servicesService.findById(createDto.serviceId)
      : undefined;

    if (!service && createDto.serviceType) {
      service = await this.servicesService.findByReference(
        createDto.serviceType,
      );
    }

    if (!service) {
      service = await this.servicesService.findDefaultQuoteService();
    }

    if (!service) {
      throw new NotFoundException(
        createDto.serviceType || createDto.serviceId
          ? "Service not found for the supplied serviceType/serviceId"
          : "No active service is available to attach this quote request to",
      );
    }

    const customer = await this.customersService.createOrMatch({
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      email: createDto.email,
      phone: createDto.phone,
    });

    const quoteRequest = await this.prisma.quoteRequest.create({
      data: {
        customerId: customer.id,
        serviceId: service.id,
        postcode: createDto.postcode,
        propertyType: createDto.propertyType,
        bedrooms: createDto.bedrooms,
        bathrooms: createDto.bathrooms,
        preferredDate: createDto.preferredDate
          ? new Date(createDto.preferredDate)
          : undefined,
        details: createDto.details,
      },
      include: {
        customer: true,
        service: true,
      },
    });

    await Promise.allSettled([
      this.emailService.sendAdminQuoteAlert({
        customerName:
          `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() ||
          "Customer",
        customerEmail: customer.email,
        customerPhone: customer.phone,
        serviceName: service.name,
        details: createDto.details,
        quoteRequestId: quoteRequest.id,
      }),
      ...(customer.email
        ? [
            this.emailService.sendCustomerQuoteConfirmation({
              recipient: customer.email,
              customerName: customer.firstName ?? "there",
              customerPhone: customer.phone,
              serviceName: service.name,
              requestedDate: createDto.preferredDate,
              location: createDto.postcode,
              propertyType: createDto.propertyType,
              quoteDetails: createDto.details,
              quoteRequestId: quoteRequest.id,
            }),
          ]
        : []),
      this.analyticsService.trackEvent({
        type: "QUOTE_SUBMITTED",
        entityType: "QuoteRequest",
        entityId: quoteRequest.id,
        metadata: {
          customerId: customer.id,
          serviceId: service.id,
        },
      }),
      this.auditLogsService.create({
        action: "QUOTE_CREATED",
        entityType: "QuoteRequest",
        entityId: quoteRequest.id,
        description: "Public quote request submitted",
        metadata: {
          customerId: customer.id,
          serviceId: service.id,
        },
      }),
    ]);

    return quoteRequest;
  }

  findAll() {
    return this.prisma.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: this.quoteRequestInclude(),
    });
  }

  async findOne(id: string) {
    const quoteRequest = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: this.quoteRequestDetailInclude(),
    });

    if (!quoteRequest) {
      throw new NotFoundException("Quote request not found");
    }

    return quoteRequest;
  }

  async updateStatus(
    id: string,
    updateDto: UpdateQuoteRequestStatusDto,
    adminUserId?: string,
  ) {
    const existing = await this.prisma.quoteRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException("Quote request not found");
    }

    const quoteRequest = await this.prisma.quoteRequest.update({
      where: { id },
      data: {
        status: updateDto.status as QuoteRequestStatus,
      },
      include: this.quoteRequestInclude(),
    });

    await this.auditLogsService.create({
      action: "QUOTE_STATUS_UPDATED",
      entityType: "QuoteRequest",
      entityId: id,
      description: `Quote request status updated to ${updateDto.status}`,
      adminUserId,
      metadata: {
        status: updateDto.status,
      },
    });

    return quoteRequest;
  }

  async createQuoteFromRequest(
    id: string,
    createDto: CreateQuoteFromRequestDto,
    adminUserId?: string,
  ) {
    const quoteRequest = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: this.quoteRequestDetailInclude(),
    });

    if (!quoteRequest) {
      throw new NotFoundException("Quote request not found");
    }

    if (quoteRequest.createdQuote) {
      throw new BadRequestException(
        `Quote ${quoteRequest.createdQuote.quoteNumber} has already been created from this request`,
      );
    }

    const customerName =
      this.trimToUndefined(createDto.customerName) ??
      this.customerName(quoteRequest.customer);
    const customerEmail =
      this.trimToUndefined(createDto.customerEmail)?.toLowerCase() ??
      quoteRequest.customer.email?.toLowerCase();

    if (!customerName || !customerEmail) {
      throw new BadRequestException(
        "Customer name and email are required to create a quote from a request",
      );
    }

    const issueDate =
      this.trimToUndefined(createDto.issueDate) ?? new Date().toISOString();
    const expiryDate =
      createDto.expiryDate === undefined
        ? this.addDays(new Date(), 14).toISOString()
        : createDto.expiryDate;
    const documentType =
      createDto.documentType ??
      this.inferQuoteDocumentTypeFromService(quoteRequest.service.name);
    const defaultScope = this.defaultScopeForDocumentType(documentType);

    const quote = await this.quotesService.create(
      {
        documentType,
        quoteNumber: createDto.quoteNumber,
        customerName,
        customerEmail,
        customerPhone:
          this.trimToUndefined(createDto.customerPhone) ??
          quoteRequest.customer.phone ??
          undefined,
        customerAddress:
          this.trimToUndefined(createDto.customerAddress) ??
          quoteRequest.postcode ??
          undefined,
        serviceAddress:
          this.trimToUndefined(createDto.serviceAddress) ??
          quoteRequest.postcode ??
          undefined,
        issueDate,
        expiryDate,
        preparedBy:
          this.trimToUndefined(createDto.preparedBy) ?? "UltraSpark Cleaning",
        status: QuoteStatus.DRAFT,
        paymentTerms:
          this.trimToUndefined(createDto.paymentTerms) ??
          "Payment is due on completion unless agreed otherwise.",
        specialInstructions:
          this.trimToUndefined(createDto.specialInstructions) ??
          this.specialInstructionsFromRequest(quoteRequest),
        included:
          this.trimToUndefined(createDto.included) ?? defaultScope.included,
        excluded:
          this.trimToUndefined(createDto.excluded) ?? defaultScope.excluded,
        notes:
          this.trimToUndefined(createDto.notes) ??
          this.notesFromRequest(quoteRequest),
        showSignature: createDto.showSignature ?? true,
        discount: createDto.discount ?? 0,
        tax: createDto.tax ?? 0,
        lineItems: createDto.lineItems?.length
          ? createDto.lineItems
          : [
              {
                serviceName: quoteRequest.service.name,
                description:
                  `${quoteRequest.details}\n\nPricing must be confirmed by UltraSpark before sending.`.trim(),
                rate: 0,
                quantity: 1,
              },
            ],
      },
      adminUserId,
      quoteRequest.id,
    );

    await this.prisma.quoteRequest.update({
      where: { id },
      data: { status: QuoteRequestStatus.QUOTED },
    });

    await this.auditLogsService.create({
      action: "QUOTE_CREATED",
      entityType: "QuoteRequest",
      entityId: id,
      description: `Quote ${quote.quoteNumber} created from website quote request`,
      adminUserId,
      metadata: {
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        customerId: quote.customerId,
      },
    });

    return quote;
  }

  private quoteRequestInclude() {
    return {
      customer: true,
      service: true,
      createdQuote: {
        include: {
          lineItems: true,
        },
      },
    };
  }

  private quoteRequestDetailInclude() {
    return {
      ...this.quoteRequestInclude(),
      emailLogs: {
        orderBy: { createdAt: "desc" as const },
      },
    };
  }

  private customerName(customer: {
    firstName?: string | null;
    lastName?: string | null;
  }) {
    return `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
  }

  private specialInstructionsFromRequest(
    request: Awaited<ReturnType<QuoteRequestsService["findOne"]>>,
  ) {
    return [
      request.preferredDate
        ? `Requested date: ${request.preferredDate.toISOString()}`
        : undefined,
      request.propertyType
        ? `Property type: ${request.propertyType}`
        : undefined,
      request.bedrooms !== null && request.bedrooms !== undefined
        ? `Bedrooms: ${request.bedrooms}`
        : undefined,
      request.bathrooms !== null && request.bathrooms !== undefined
        ? `Bathrooms: ${request.bathrooms}`
        : undefined,
    ]
      .filter(Boolean)
      .join("\n");
  }

  private notesFromRequest(
    request: Awaited<ReturnType<QuoteRequestsService["findOne"]>>,
  ) {
    return [
      `Created from website quote request ${request.id}.`,
      request.preferredDate
        ? `Requested date: ${request.preferredDate.toISOString()}`
        : undefined,
      request.details,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  private defaultScopeForDocumentType(documentType: QuoteDocumentType) {
    const generalIncluded =
      "General cleaning of reachable surfaces, agreed rooms/areas, kitchen or welfare areas where applicable, bathroom/toilet areas, vacuuming, mopping, and bins emptied.";
    const generalExcluded =
      "Carpet shampooing, external windows, deep stain removal, mould removal, specialist cleaning, hazardous waste, and cleaning inside appliances unless agreed in writing.";

    const scopes: Partial<
      Record<QuoteDocumentType, { included: string; excluded: string }>
    > = {
      [QuoteDocumentType.HOUSE_CLEANING_QUOTE]: {
        included:
          "General cleaning of reachable surfaces, kitchen, bathrooms, bedrooms, living areas, vacuuming, mopping, and bins emptied.",
        excluded:
          "Carpet shampooing, external windows, mould removal, specialist stain removal, and hazardous waste unless agreed in writing.",
      },
      [QuoteDocumentType.HOUSE_CLEANING_ESTIMATE]: {
        included:
          "General cleaning of reachable surfaces, kitchen, bathrooms, bedrooms, living areas, vacuuming, mopping, and bins emptied.",
        excluded:
          "Carpet shampooing, external windows, mould removal, specialist stain removal, and hazardous waste unless agreed in writing.",
      },
      [QuoteDocumentType.OFFICE_CLEANING_QUOTE]: {
        included:
          "General cleaning of reachable surfaces, desks/work surfaces, reception areas, office areas, kitchen surfaces, bathroom/toilet areas, vacuuming, mopping, and bins emptied.",
        excluded:
          "Carpet shampooing, external windows, deep stain removal, mould removal, specialist cleaning, hazardous waste, and cleaning inside appliances unless agreed in writing.",
      },
      [QuoteDocumentType.DEEP_CLEANING_QUOTE]: {
        included:
          "Detailed cleaning of reachable surfaces, kitchens, bathrooms, internal cupboards where agreed, skirting boards, door frames, switches, floors, vacuuming, mopping, and bins emptied.",
        excluded:
          "External windows, carpet shampooing, mould remediation, specialist stain removal, pest treatment, hazardous waste, and heavy furniture moving unless agreed in writing.",
      },
      [QuoteDocumentType.END_OF_TENANCY_CLEANING_QUOTE]: {
        included:
          "End-of-tenancy cleaning of agreed rooms, kitchen surfaces, bathroom/toilet areas, reachable internal surfaces, floors, skirting boards, and appliances where agreed in writing.",
        excluded:
          "Carpet shampooing, external windows, wall washing, rubbish removal, mould remediation, pest treatment, and specialist stain removal unless agreed in writing.",
      },
      [QuoteDocumentType.AFTER_BUILDERS_CLEANING_QUOTE]: {
        included:
          "Post-construction dust removal from reachable surfaces, vacuuming, mopping, wiping fixtures, kitchen/bathroom surface cleaning, and removal of light builder residue where safe.",
        excluded:
          "Heavy rubble removal, hazardous materials, paint/plaster scraping, specialist restoration, external windows, and high-level access cleaning unless agreed in writing.",
      },
      [QuoteDocumentType.COMMERCIAL_CLEANING_QUOTE]: {
        included:
          "General cleaning of agreed commercial areas, reachable surfaces, workspaces, reception/customer areas, kitchens, toilets, floors, vacuuming, mopping, and bins emptied.",
        excluded:
          "Carpet shampooing, external windows, specialist equipment cleaning, hazardous waste, deep stain removal, and high-level cleaning unless agreed in writing.",
      },
      [QuoteDocumentType.CARPET_CLEANING_QUOTE]: {
        included:
          "Carpet cleaning of agreed areas, pre-inspection, vacuuming where required, spot attention where suitable, machine cleaning, and basic deodorising where agreed.",
        excluded:
          "Furniture removal, specialist stain guarantees, repairs, dyeing, pest treatment, mould remediation, and drying equipment hire unless agreed in writing.",
      },
      [QuoteDocumentType.MOVE_IN_MOVE_OUT_CLEANING_QUOTE]: {
        included:
          "Move-in/move-out cleaning of agreed rooms, reachable surfaces, kitchens, bathrooms, cupboards where agreed, floors, vacuuming, mopping, and bins emptied.",
        excluded:
          "Carpet shampooing, rubbish removal, external windows, mould remediation, specialist stain removal, and cleaning behind heavy furniture unless agreed in writing.",
      },
      [QuoteDocumentType.GENERAL_CLEANING_QUOTE]: {
        included: generalIncluded,
        excluded: generalExcluded,
      },
    };

    return (
      scopes[documentType] ?? {
        included: generalIncluded,
        excluded: generalExcluded,
      }
    );
  }

  private inferQuoteDocumentTypeFromService(serviceName?: string | null) {
    const normalized = (serviceName ?? "").toLowerCase();

    if (normalized.includes("office")) {
      return QuoteDocumentType.OFFICE_CLEANING_QUOTE;
    }
    if (normalized.includes("commercial")) {
      return QuoteDocumentType.COMMERCIAL_CLEANING_QUOTE;
    }
    if (normalized.includes("deep")) {
      return QuoteDocumentType.DEEP_CLEANING_QUOTE;
    }
    if (
      normalized.includes("end of tenancy") ||
      normalized.includes("end-of-tenancy")
    ) {
      return QuoteDocumentType.END_OF_TENANCY_CLEANING_QUOTE;
    }
    if (
      normalized.includes("after builder") ||
      normalized.includes("builders")
    ) {
      return QuoteDocumentType.AFTER_BUILDERS_CLEANING_QUOTE;
    }
    if (normalized.includes("carpet")) {
      return QuoteDocumentType.CARPET_CLEANING_QUOTE;
    }
    if (
      normalized.includes("move-in") ||
      normalized.includes("move in") ||
      normalized.includes("move-out") ||
      normalized.includes("move out")
    ) {
      return QuoteDocumentType.MOVE_IN_MOVE_OUT_CLEANING_QUOTE;
    }
    if (normalized.includes("home") || normalized.includes("house")) {
      return QuoteDocumentType.HOUSE_CLEANING_QUOTE;
    }

    return QuoteDocumentType.GENERAL_CLEANING_QUOTE;
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private trimToUndefined(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}
