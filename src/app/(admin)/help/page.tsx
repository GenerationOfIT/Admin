// The editors' manual. Keep it in step with the forms: when a rule, limit or
// section changes, update the matching text here.

const contents = [
  { id: "basics", label: "How the panel works" },
  { id: "images", label: "Image rules" },
  { id: "addresses", label: "Page addresses" },
  { id: "search", label: "Search results" },
  { id: "courses", label: "Courses" },
  { id: "events", label: "Events" },
  { id: "services", label: "Services" },
  { id: "testimonials", label: "Testimonials" },
  { id: "team", label: "Team" },
  { id: "partners", label: "Partners" },
  { id: "graduates", label: "Graduates" },
  { id: "orders", label: "Orders" },
  { id: "emails", label: "Emails" },
  { id: "media", label: "Images page" },
  { id: "developer", label: "What needs a developer" },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold">Help</h1>
      <p className="text-muted mb-6">
        What each section of the admin panel changes on the website, and the
        rules each form checks before it saves.
      </p>

      <nav
        aria-label="Help contents"
        className="bg-surface border-border mb-10 rounded-xl border p-4"
      >
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {contents.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="hover:underline">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="basics" title="How the panel works">
        <List
          items={[
            "Sign in with your email and password. Accounts are created by a developer; there is no sign-up.",
            "Changes reach the website a few seconds after you save. If a page on the site still looks old, reload it.",
            "Things that change with the date alone, such as an event starting or enrollment and registration opening or closing, update on the site once a day around 03:00 UTC (07:00 in Tbilisi), or sooner when related content is saved. Until then a page can show an old status, but payments always check the dates live, so nobody can enroll after the closing date.",
            "Each form, and each course tab, has its own Save button at the bottom. It becomes active once you change something, and “Unsaved changes” shows next to it until you save.",
            "“Discard changes”, next to Save, puts the form back to how it was at the last save, after asking first. On “New …” pages, Cancel goes back to the list instead.",
            "Leaving a page with unsaved changes asks first: clicking a link in the admin asks “Leave this page and lose them?”, and closing the tab or reloading shows the browser’s own “Leave site?” warning. The browser’s Back button doesn’t ask, so save before using it.",
            "If a field breaks a rule, the message appears under that field and nothing is saved. Fix it and save again.",
            "Published items show on the site. Unpublished items (drafts) stay here but are hidden from the site. Everything new starts unpublished, except a course’s lecturers.",
            "Prefer Unpublish over Delete. Deleting can’t be undone.",
            "The order of a list (courses, events, services, team, partners, graduates, and testimonials per page) is the order on the site. To change it, press Edit order, move rows with the arrows (instant, nothing is saved yet), then press Save order. Cancel throws the changes away.",
            "If someone added or deleted an item while you were reordering, saving is refused. Reload the page and do it again.",
            "In longer text fields, separate paragraphs with a blank line.",
            "A page you opened in the last 30 seconds opens instantly from memory. Your own saves always show right away, but changes made elsewhere (new orders, another admin’s edits) can take up to 30 seconds to appear on it. Reload the browser page to see the latest.",
          ]}
        />
      </Section>

      <Section id="images" title="Image rules">
        <List
          items={[
            "JPEG, PNG or WebP files, up to 5 MB.",
            "Images are uploaded exactly as you pick them: not resized, cropped or compressed. Prepare them at the recommended size shown under each image field.",
            "Recommended sizes: team photos 800 × 800 px, lecturer and testimonial photos 400 × 400 px, all square; graduate photos 600 × 780 px, portrait; partner logos 480 × 120 px with a transparent background; event photos 1920 × 1080 px, landscape; event speaker photos 600 × 600 px, square.",
            "Picking a file only shows a preview. It is uploaded when you press Save; if the save fails, the upload is removed again.",
            "“Choose existing” lets you reuse an image that was uploaded before, including ones uploaded in bulk on the Images page.",
            "Removing an image from a field doesn’t delete the file. It stays in the library and appears on the Images page under Unused.",
          ]}
        />
      </Section>

      <Section id="addresses" title="Page addresses">
        <p className="text-muted mb-3">
          Courses, events and services each have their own page, for example
          /courses/manual-testing. The Slug field is only that last part.
        </p>
        <List
          items={[
            "Lowercase letters, numbers and single hyphens, up to 100 characters. No slashes or spaces. Example: manual-testing.",
            "Each slug must be unique: two courses, two events or two services can’t share one.",
            "Changing the slug of a page that is already live breaks links people saved and Google results until Google updates them. Avoid it once a page is public.",
          ]}
        />
      </Section>

      <Section id="search" title="Search results">
        <p className="text-muted mb-3">
          Courses and services have a “Search results” section (SEO title and
          SEO description) that controls how the page looks on Google and when
          the link is shared, with a preview.
        </p>
        <List
          items={[
            "If a field is left empty, the page’s own title or introduction is used for it.",
            "The counter recommends up to 60 characters for the title and 160 for the description. Longer text still saves, but Google may cut it off.",
            "Hard limits: 120 characters for the title, 320 for the description. There’s no minimum: even a single word saves, so check the preview. A title of a few words and a description of a sentence or two work best.",
          ]}
        />
      </Section>

      <Section id="courses" title="Courses">
        <Sub title="Course list">
          <List
            items={[
              "The order here is the order on the home and academy pages.",
              "The badge shows whether students can enroll today:",
            ]}
          />
          <Terms
            items={[
              ["Enrolling", "Students can enroll and pay now."],
              ["Upcoming", "Enrollment opens on the opening date."],
              ["Paused", "Within the dates, but enrollment is switched off."],
              ["Closed", "The closing date has passed."],
              ["Not open", "Enrollment is off or the dates are missing."],
            ]}
          />
        </Sub>

        <Sub title="New course">
          <List
            items={[
              "Title (required, up to 120 characters), slug, and card description (required, up to 300; shown on the home and academy course cards).",
              "The course is created unpublished and opens in its editor, where the rest is filled in tab by tab.",
            ]}
          />
        </Sub>

        <Sub title="Basics tab">
          <List
            items={[
              "“Published on the site” and “Show the Popular badge” (a badge on the course cards).",
              "Title, up to 120 characters. For some courses a red box warns that the site also writes the course name as fixed text in other places (for example the About page). Those places don’t change with the title; a developer has to update them.",
              "Slug and card description, as for a new course.",
              "Introduction: the text under the title on the course page, up to 2,000 characters.",
              "“Real course” changes nothing visitors see. When it’s on, the course page tells Google it’s a course and the academy page includes it in its course list for Google, which can help it show in course results. Google counts something as a course when it has lessons or modules on a subject, a clear skill or knowledge students gain, and instructors teaching enrolled students; all of our courses with a curriculum fit. Turn it off for anything else, such as a one-off workshop, talk or event, mentoring, or a job placement or internship program, since Google’s rules only allow course markup on real courses.",
              "Academy card: Summary, “Who is this for” and “Why choose this course”, up to 500 characters each, shown on this course’s card on the academy page.",
              "Delete course removes the course, its price and all its content. A course with orders can’t be deleted; unpublish it instead. Testimonials linked to a deleted course are unpublished and unlinked, so you can attach them to another course.",
            ]}
          />
        </Sub>

        <Sub title="Lecturers tab">
          <List
            items={[
              "Each course has its own list of lecturers, up to 30, in the order shown on the site.",
              "Name (up to 120 characters) and role (up to 160) are required.",
              "LinkedIn is optional. If given, it must be a LinkedIn link, e.g. https://www.linkedin.com/in/name, and the lecturer’s card links there with a LinkedIn badge. Without one the card shows without a link.",
              "Photo is optional; without one the site shows a placeholder. Photo description (up to 200 characters) is read by screen readers; empty uses the name.",
              "Each lecturer can be published or hidden on their own.",
            ]}
          />
        </Sub>

        <Sub title="Overview, Curriculum, Capstone and Outcomes tabs">
          <p className="text-muted mb-3">
            These are the content tabs on the course page. Each has a heading
            (up to 200 characters), a text (up to 5,000; not on Outcomes) and a
            list of cards (up to 50; title up to 120, description up to 1,000).
            Curriculum calls its cards “parts” and also has a list of tools (up
            to 30, each up to 60 characters).
          </p>
          <p className="text-muted mb-2">
            A tab only appears on the course page when:
          </p>
          <Terms
            items={[
              ["Overview", "It has a heading or at least one card."],
              ["Curriculum", "It has at least one part."],
              ["Capstone", "It has text. Cards alone don’t show it."],
              ["Outcomes", "It has at least one card."],
            ]}
          />
        </Sub>

        <Sub title="Stats tab">
          <List
            items={[
              "Duration, Lectures, Hours and Format, up to 60 characters each. They appear in the course facts and the Schedule & Pricing tab.",
              "Leave a field empty, or write TBA, to show it as not announced yet.",
              "Lectures is shown together with Hours, e.g. “24 (48 hours)”.",
              "Format is also used in confirmation emails.",
            ]}
          />
        </Sub>

        <Sub title="Schedule & pricing tab">
          <List
            items={[
              "All dates are calendar days in Tbilisi time, the same as checkout.",
              "Students can enroll only when “Enrollment switched on” is ticked and today is between the opening and closing dates. They can still enroll on the closing day.",
              "With enrollment switched on, both dates are required, and the closing date can’t be before the opening date.",
              "The line at the top shows what that means today (enrolling, upcoming, paused, closed or not open).",
              "Course starts is optional; it shows on the course page and in confirmation emails.",
              "Tuition is the full price in dollars: more than $0, up to $100,000, at most two decimals (type 900 for $900). Paying it in full is always offered.",
              "Orders already made keep the price they were bought at.",
              "“Let students pay in parts”: students choose each amount and come back to pay the rest. Nothing is charged automatically.",
              "Minimum payment applies to each part and can’t be more than the tuition. A smaller final payment is always allowed.",
              "Pricing card: the title (required, up to 120 characters), description (up to 300) and up to 20 “included” items (up to 200 each) shown on the price card.",
            ]}
          />
        </Sub>
      </Section>

      <Section id="events" title="Events">
        <Sub title="Event list">
          <List
            items={[
              "The home page lists upcoming published events in the order of this list. Once an event has started it drops off the home page within a day (see How the panel works), but its own page stays.",
              "Each row shows the date and time at the venue and whether people can register today.",
              "Publish needs a photo and both registration dates; until then the row says what’s missing.",
              "The site’s registration form doesn’t take payments or save sign-ups yet: it asks visitors to contact you instead.",
              "The badge shows whether people can register today:",
            ]}
          />
          <Terms
            items={[
              ["Registering", "People can register now."],
              ["Upcoming", "Registration opens on the opening date."],
              ["Paused", "Within the dates, but registration is switched off."],
              [
                "Closed",
                "The closing date has passed or the event has started.",
              ],
              [
                "Not open",
                "Registration is switched off and the opening date hasn’t come.",
              ],
              ["No dates", "Registration dates aren’t set yet."],
            ]}
          />
        </Sub>
        <Sub title="New event">
          <List
            items={[
              "Title, slug, card description, and the date and start time with the venue’s time zone.",
              "It’s created as a draft with registration off. Fill in the tabs, then publish it.",
            ]}
          />
        </Sub>
        <Sub title="Basics tab">
          <List
            items={[
              "Published, title (up to 120 characters), slug, card description (up to 300; shown on the home page card) and introduction (up to 2,000; the text at the top of the event page).",
              "Photo: required to publish. 1920 × 1080 px, landscape; it fills the event page’s header and shows on the home card.",
              "Price in US dollars, 0 for a free event (the site then says Free). At most $100,000 and two decimals.",
              "An event with sign-ups can’t be deleted; unpublish it instead. Deleting removes its highlights, agenda and speakers too; photos stay in the image library.",
            ]}
          />
        </Sub>
        <Sub title="Schedule tab">
          <List
            items={[
              "Date, start time and time zone are as they are at the venue; visitors see the event in that time zone wherever they are. The end date and time are optional, given together, and must be after the start.",
              "Location is the text visitors read, e.g. “Tech Park, Tbilisi” or “Online via Zoom”. Street, city and country are optional and help Google show the event.",
              "Registration is open only while “Registration switched on” is ticked and today is between the opening and closing dates, counted in the event’s time zone. People can still register on the closing day.",
              "The closing date can’t be after the event’s day, and registration always closes once the event starts. Give both dates or neither; a published event needs both.",
              "The line at the top shows what that means today, with the same words as the badge in the event list.",
            ]}
          />
        </Sub>
        <Sub title="Highlights, Agenda and Speakers tabs">
          <List
            items={[
              "Highlights: up to 12 short points with an icon (Speakers, Workshops, Attendees, Demos, Careers or Networking), in the order you set.",
              "Agenda: a section title and up to 40 items with a time, title and optional description. Times are times of day on the event’s date at the venue. The site lists them by time, so they’re sorted when you save.",
              "Speakers: up to 30, each with a name, optional job title and company, and an optional square photo (600 × 600 px). They belong to this event only, so a speaker’s role stays as it was at the time.",
            ]}
          />
        </Sub>
      </Section>

      <Section id="services" title="Services">
        <List
          items={[
            "The order in the list is the order on the home page.",
            "A new service needs a title (up to 120 characters), a slug and a card description (up to 300; shown on the home page card and in the service request form). It starts unpublished.",
            "Introduction: the text under the title on the service page, up to 2,000 characters. Empty uses the card description.",
            "The page has three sections in this order: Scope, Use cases and Deliverables. Each has its own title (required, up to 120 characters) and up to 50 cards. A section with no cards is hidden.",
            "Delete removes the service and all its cards. Testimonials linked to it are unpublished and unlinked, so you can attach them to another service.",
          ]}
        />
      </Section>

      <Section id="testimonials" title="Testimonials">
        <Sub title="Clients and graduates">
          <List
            items={[
              "Clients are companies we tested for. They can appear on the home page and on one service page.",
              "Graduates are academy students. They can appear on the home page, the academy page and one course page.",
              "A published testimonial must appear in at least one place. If you change the type, places that don’t apply to the new type are dropped.",
              "If its service or course is deleted, the testimonial is unpublished and shows a “No placement” badge in the list.",
            ]}
          />
        </Sub>
        <Sub title="Fields">
          <List
            items={[
              "Name (required, up to 120 characters).",
              "Job title and company are optional (up to 120 characters each). With both, the card shows “Job title at Company”; with one, just that one; with neither, that part is left out.",
              "Context (up to 120), shown after a dot, e.g. the service they used.",
              "Quote (required, up to 2,000 characters). Cards show about five lines; the full quote opens on click.",
              "Photo is optional and shown as a small circle, so a square photo crops best.",
            ]}
          />
        </Sub>
        <Sub title="Order on site">
          <List
            items={[
              "Each page has its own order. Pick a page on the left, press Edit order, move testimonials with the arrows, then Save order. It only changes that page.",
              "Newly placed testimonials go to the end of the page’s list.",
              "Delete removes a testimonial from every page.",
            ]}
          />
        </Sub>
      </Section>

      <Section id="team" title="Team">
        <List
          items={[
            "Team members appear on the About page, in the order of the list.",
            "Name (required, up to 120 characters), role (required, up to 160) and organization (optional, up to 160).",
            "A photo is required before publishing. Its description for screen readers is set automatically to “Portrait of” and the name.",
            "Deleting a member keeps their photo in the image library.",
          ]}
        />
      </Section>

      <Section id="partners" title="Partners">
        <List
          items={[
            "Partner logos scroll in the “Our Partner Companies” strip on the home page, in the order of the list. While no partner is published, the whole section is hidden.",
            "A logo is required before publishing, about 480 × 120 px. Any accepted format works (JPEG, PNG or WebP), but use a PNG or WebP with a transparent background: a JPEG can’t be transparent, so its background shows as a box around the logo. SVG files aren’t accepted; export them as PNG or WebP. It’s shown small and slightly faded, centred in its box.",
            "The name isn’t shown on the page; screen readers announce it instead of the logo. Up to 120 characters.",
            "Partner logos don’t link anywhere.",
            "Deleting a partner keeps their logo in the image library.",
          ]}
        />
      </Section>

      <Section id="graduates" title="Graduates">
        <List
          items={[
            "Graduates appear in the photo carousel on the Graduates page and the About page, in the order of the list. While none are published, the About page hides its section and the Graduates page shows only its heading.",
            "Title line (required, up to 120 characters) is shown above the name: the course they took, their job, or anything else, e.g. “API & Performance Testing” or “QA Engineer at TBC Bank”.",
            "Name (required, up to 120 characters).",
            "A photo is required before publishing: portrait, about 600 × 780 px. It’s cropped to fill the card, so keep the face near the middle. Its description for screen readers is set automatically to the name and “GenofIT graduate”.",
            "The carousel repeats the list to keep looping, so with only a few graduates the same person can appear more than once on screen.",
            "Deleting a graduate keeps their photo in the image library.",
          ]}
        />
      </Section>

      <Section id="orders" title="Orders">
        <List
          items={[
            "Read-only: orders are created by checkout on the site, and nothing here changes them.",
            "Sandbox shows test payments, Live shows real ones. They are never mixed.",
            "Filters: Owes money (the default), Paid, Checkout not finished, Closed (failed, canceled or refunded) and All. Search finds customers by name or email. 50 orders per page.",
            "Checkout not finished: the customer verified their email and opened the payment page but hasn’t paid anything yet, either because they left or because they are paying right now. There is one per customer and course; if they come back, the same order is used, updated to the course’s current price and minimum payment and to that day’s date. Useful for following up.",
            "The newest activity comes first: the latest payment, or for orders with nothing paid, when checkout was opened. A student paying a second part moves back to the top. Click the Started or Payments header to sort by it; click again to switch between newest and oldest first. The arrow shows the current order.",
            "Started is the date of the first payment, or when checkout was opened if nothing is paid yet. Payments lists the latest three payments with their amounts, newest first, and how many more there are; the order page has them all.",
            "Once anything is paid, the order keeps its price and minimum, even if the course’s price changes later.",
            "Closed orders only come from the earlier one-time checkout. Today nothing marks an order failed, canceled or refunded; a refund made in Stripe still shows as Paid here.",
            "The line at the top shows how many orders owe money and the total outstanding.",
            "Paid shows what was paid out of the total; Balance is what’s still owed.",
            "Dates and times on order and email pages are in UTC and marked “UTC”. Tbilisi is 4 hours ahead, so 20:30 UTC is 00:30 the next day in Tbilisi.",
            "Refunds are made in Stripe and don’t update orders here yet.",
            "A new order can take up to 30 seconds to appear if you opened Orders just before. Reload the page to check for the latest.",
          ]}
        />
        <Sub title="Order page">
          <List
            items={[
              "Payment: status, amounts and links to the payment in Stripe.",
              "Customer: who bought it.",
              "Payments: each payment attempt. Paid, In progress (checkout open) or Not completed.",
              "Emails: the order’s payment emails and their status (see Emails below).",
              "Orders from the earlier one-time checkout have no payment history.",
            ]}
          />
        </Sub>
        <Sub title="If a customer paid but the order didn’t update">
          <p className="text-muted mb-3">
            Stripe tells the site about each finished payment. If the site
            couldn’t save it, for example because it was briefly down, the order
            looks unpaid even though Stripe has the money. Don’t try to fix the
            order by hand; let Stripe send the payment again:
          </p>
          <List
            items={[
              "Stripe retries on its own: for up to three days in Live, and three times over a few hours in Sandbox.",
              "To do it now: in the Stripe dashboard open Workbench → Webhooks → the site’s endpoint → Event deliveries. Find the failed checkout event and click Resend. This works for 15 days after the payment.",
              "When it goes through, the order’s amount paid, status, payment history and email all update together, the same as a normal payment. Sending it more than once doesn’t count the payment twice.",
              "If Resend fails again, the site has a bug. Stripe keeps the payment; tell a developer and resend once it’s fixed.",
              "Other changes made in Stripe, such as refunds and disputes, don’t reach the site at all yet.",
            ]}
          />
        </Sub>
      </Section>

      <Section id="emails" title="Emails">
        <p className="text-muted mb-3">
          Every payment email the site sends, across all orders. Read-only:
          nothing here sends or resends an email.
        </p>
        <List
          items={[
            "The first payment on an order sends the Course welcome, with the start date and format; each later payment sends a Payment receipt with the remaining balance. Paying in full at once sends only the welcome, which already says the course is fully paid.",
            "Problems (the default) shows every email that failed and still isn’t sent: ones retrying and ones that stopped retrying. The line at the top counts them. Not sent yet also includes emails queued moments ago.",
            "Sandbox and Live work as on Orders. Search finds emails by recipient. Click a row to open its order.",
          ]}
        />
        <Terms
          items={[
            [
              "Sent",
              "The email service accepted it. Delivery problems such as bounces only show in the email service’s own logs.",
            ],
            ["Queued", "Just created; it normally goes out within seconds."],
            [
              "Retrying",
              "Sending failed. It is retried after the next payment or in the daily run, not before the “earliest retry” time. The Problem column shows the last error.",
            ],
            [
              "Stopped retrying",
              "It couldn’t be confirmed within 1 to 2 days, so it stopped retrying to avoid sending it twice. Ask a developer to check the email service’s logs before anything is resent.",
            ],
          ]}
        />
      </Section>

      <Section id="media" title="Images page">
        <p className="text-muted mb-3">
          All uploaded images, with a tab for each section: Testimonials, Team,
          Lecturers, Partners, Graduates, Events, Unused and Other. The number
          next to each tab is how many images it shows.
        </p>
        <List
          items={[
            "Upload several images at once: open a section’s tab and drop them on the box at the top, or click it to choose files. They’re uploaded to that section with the same rules as the forms (JPEG, PNG or WebP, up to 5 MB, uploaded as is). Each file shows its own result, so one rejected file doesn’t stop the others.",
            "Then use them in a form with “Choose existing”, which opens on that form’s section; the chips at the top switch to another section or to All.",
            "A section’s tab shows the images that section uses, wherever they were uploaded, plus images uploaded there that nothing uses yet (marked “Not used yet”), so new uploads stay where you dropped them.",
            "An image can be used in more than one section; it then appears in each of their tabs. “From Team” means it was uploaded to Team. Under each image, “Used by” lists every place that shows it, with a link to edit it.",
            "Unused lists every image nothing uses right now, newest first. Select images there and delete them to remove them from storage for good. Images that came back into use in the meantime are skipped. Nothing is deleted automatically.",
            "Events holds event photos and event speaker photos.",
            "Other holds what no section tab covers: files in any other folder, for example put straight into storage by a developer, whether used or not. Unused ones there also appear in Unused, where they can be deleted.",
            "The search box finds images by file name or by who uses them, e.g. a graduate’s name, even if the file is called something else. It filters every tab at once, and the numbers on the tabs show the matches. In Unused, “Select all” then selects only the matches.",
          ]}
        />
      </Section>

      <Section id="developer" title="What needs a developer">
        <List
          items={[
            "Course names written as fixed text on the About, Academy and QA Bridge pages (see the warning in the Basics tab).",
            "Adding or removing admin accounts.",
            "Stripe, email and website settings, and any text on the site that has no field in this panel.",
          ]}
        />
      </Section>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-8">
      <h2 className="border-border mb-4 border-b pb-2 text-xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Sub({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 font-bold">{title}</h3>
      {children}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="text-muted flex list-disc flex-col gap-1.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Terms({ items }: { items: [string, string][] }) {
  return (
    <dl className="bg-surface border-border mt-2 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-1.5 rounded-xl border p-4 text-sm">
      {items.map(([term, meaning]) => (
        <div key={term} className="contents">
          <dt className="font-bold">{term}</dt>
          <dd className="text-muted">{meaning}</dd>
        </div>
      ))}
    </dl>
  );
}
