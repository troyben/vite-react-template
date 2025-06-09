import type { Quotation, QuotationItem } from '../services/api';

// Dummy items for quotations
const items1: QuotationItem[] = [
  {
    item: "Website Design",
    description: "Design of main website",
    quantity: 1,
    price: 1500,
    total: 1500
  },
  {
    item: "SEO Service",
    description: "3 months of SEO service",
    quantity: 3,
    price: 300,
    total: 900
  }
];

const items2: QuotationItem[] = [
  {
    item: "Logo Design",
    description: "Company logo design",
    quantity: 1,
    price: 500,
    total: 500
  },
  {
    item: "Business Cards",
    description: "Design and printing of 100 cards",
    quantity: 100,
    price: 2,
    total: 200
  }
];

const items3: QuotationItem[] = [
  {
    item: "Mobile App Development",
    description: "iOS app development",
    quantity: 1,
    price: 6155.91,
    total: 6155.91
  }
];

const items4: QuotationItem[] = [
  {
    item: "UX Research",
    description: "User research and testing",
    quantity: 2,
    price: 1516.17,
    total: 3032.33
  },
  {
    item: "User Journey Map",
    description: "Customer journey visualization",
    quantity: 1,
    price: 1000,
    total: 1000
  }
];

const items5: QuotationItem[] = [
  {
    item: "Web Hosting",
    description: "Annual web hosting",
    quantity: 1,
    price: 102.04,
    total: 102.04
  }
];

const items6: QuotationItem[] = [
  {
    item: "Market Analysis",
    description: "Competitor analysis",
    quantity: 1,
    price: 1200,
    total: 1200
  },
  {
    item: "Strategy Document",
    description: "Marketing strategy documentation",
    quantity: 1,
    price: 1902.04,
    total: 1902.04
  }
];

// Mock Quotation data matching the screenshot
export const mockQuotations: Quotation[] = [
  {
    id: 941,
    client_name: "Alex Grim",
    client_email: "alexgrim@mail.com",
    items: items1,
    total_amount: 556.00,
    status: "sent",
    created_at: "2021-09-20T00:00:00.000Z",
    updated_at: "2021-09-20T00:00:00.000Z"
  },
  {
    id: 314,
    client_name: "John Morrison",
    client_email: "john@morrison.com",
    items: items2,
    total_amount: 14002.33,
    status: "accepted",
    created_at: "2021-10-01T00:00:00.000Z",
    updated_at: "2021-10-01T00:00:00.000Z"
  },
  {
    id: 2080,
    client_name: "Alysa Werner",
    client_email: "alysa@werner.com",
    items: items5,
    total_amount: 102.04,
    status: "sent",
    created_at: "2021-10-12T00:00:00.000Z",
    updated_at: "2021-10-12T00:00:00.000Z"
  },
  {
    id: 1449,
    client_name: "Mellisa Clarke",
    client_email: "mellisa@clarke.com",
    items: items4,
    total_amount: 4032.33,
    status: "sent",
    created_at: "2021-10-14T00:00:00.000Z",
    updated_at: "2021-10-14T00:00:00.000Z"
  },
  {
    id: 9141,
    client_name: "Thomas Wayne",
    client_email: "thomas@wayne.com",
    items: items3,
    total_amount: 6155.91,
    status: "sent",
    created_at: "2021-10-31T00:00:00.000Z",
    updated_at: "2021-10-31T00:00:00.000Z"
  },
  {
    id: 2353,
    client_name: "Anita Wainwright",
    client_email: "anita@wainwright.com",
    items: items6,
    total_amount: 3102.04,
    status: "draft",
    created_at: "2021-11-12T00:00:00.000Z",
    updated_at: "2021-11-12T00:00:00.000Z"
  }
]; 