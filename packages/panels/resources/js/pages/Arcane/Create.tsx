import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import PageHeaderActions from '../../components/ui/PageHeaderActions';
import { Card, CardBody } from '../../components/ui/Card';
import DynamicForm from '../../components/form/DynamicForm';
import { ArcanePageProps, FormSchemaItem } from '../../types';

// @arcane/form is an optional add-on package; null = use built-in DynamicForm
const HybridForm: React.ComponentType<Record<string, unknown>> | null = null;

/** Returns true when the schema has at least one layout wrapper (section/tabs/grid). */
function hasLayoutItems(schema: FormSchemaItem[]): boolean {
    return schema.some(item => {
        const t = (item as { type?: string }).type;
        return t === 'section' || t === 'tabs' || t === 'grid';
    });
}

export default function Create({ resource, schema, headerActions = [] }: ArcanePageProps) {
    const submitUrl = `/admin/${resource.slug}`;
    const useCard = !hasLayoutItems(schema);

    const formEl = HybridForm ? (
        <HybridForm
            schema={schema}
            submitUrl={submitUrl}
            method="post"
            submitLabel={`Create ${resource.label}`}
            cancelUrl={`/admin/${resource.slug}`}
            resourceSlug={resource.slug}
            recordId={null}
        />
    ) : (
        <DynamicForm
            schema={schema}
            submitUrl={submitUrl}
            method="post"
            submitLabel={`Create ${resource.label}`}
            cancelUrl={`/admin/${resource.slug}`}
            rememberKey={`create-${resource.slug}`}
            resourceSlug={resource.slug}
            recordId={null}
        />
    );

    return (
        <AdminLayout pageTitle={`Create ${resource.label}`}>
            <Breadcrumb
                crumbs={[
                    { label: resource.navigationLabel, href: `/admin/${resource.slug}` },
                    { label: 'Create' },
                ]}
                heading={`Create ${resource.label}`}
                actions={headerActions.length ? <PageHeaderActions actions={headerActions} /> : undefined}
            />
            {useCard ? (
                <Card>
                    <CardBody>{formEl}</CardBody>
                </Card>
            ) : formEl}
        </AdminLayout>
    );
}
