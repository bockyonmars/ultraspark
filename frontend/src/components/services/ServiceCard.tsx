import { Check } from "lucide-react";
import { ButtonLink } from "../Buttons";

export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  features: string[];
  image: string;
  imageAlt: string;
  reverse?: boolean;
};

type ServiceCardProps = ServiceItem;

export function ServiceCard({
  id,
  title,
  description,
  features,
  image,
  imageAlt,
  reverse = false,
}: ServiceCardProps) {
  return (
    <article id={id} className={`framer-service-row${reverse ? " framer-service-row-reverse" : ""}`}>
      <div className="framer-service-image-wrap">
        <img src={image} alt={imageAlt} className="framer-service-image" />
      </div>

      <div className="framer-service-copy">
        <h2>{title}</h2>
        <p>{description}</p>
        <ul>
          {features.map((feature) => (
            <li key={feature}>
              <Check size={15} strokeWidth={3} aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <ButtonLink href="/book-now">Book now</ButtonLink>
      </div>
    </article>
  );
}
