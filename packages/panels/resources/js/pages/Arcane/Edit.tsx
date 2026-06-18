import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import PageHeaderActions from '../../components/ui/PageHeaderActions';
import { Card, CardBody } from '../../components/ui/Card';
import DynamicForm from '../../components/form/DynamicForm';
import { ArcanePageProps, FormValues, ArcaneField, FormSchemaItem } from '../../types';

function flattenFields(items: FormSchemaItem[]): ArcaneField[] {
    const out: ArcaneField[] = [];
    for (const item of items) {
        if (item.type === 'section') { flattenFields(item.fields).forEach(f => out.push(f)); }
        else if (item.type === 'tabs') { item.tabs.forEach(t => flattenFields(t.fields).forEach(f => out.push(f))); }
        else if (item.type === 'grid') { flattenFields(item.fields).forEach(f => out.push(f)); }
        else out.push(item);
    }
    return out;
}

// @arcane/form is an optional add-on package; null = use built-in DynamicForm
const HybridForm: React.ComponentType<Record<string, unknown>> | null = null;

function hasLayoutItems(schema: FormSchemaItem[]): boolean {
    return schema.some(item => item.type === 'section' || item.type === 'tabs' || item.type === 'grid');
}

export default function Edit({ resource, schema, record, headerActions = [] }: ArcanePageProps) {
    const data = record as FormValues;
    const id   = data?.id as string | number;

    const initialValues = { ...data };
    flattenFields(schema).forEach(f => { if (f.type === 'password') initialValues[f.name] = ''; });

    const submitUrl = `/admin/${resource.slug}/${id}`;
    const useCard = !hasLayoutItems(schema);

    const formEl = HybridForm ? (
        <HybridForm
            schema={schema}
            initialValues={initialValues}
            submitUrl={submitUrl}
            method="put"
            submitLabel={`Update ${resource.label}`}
            cancelUrl={`/admin/${resource.slug}`}
            resourceSlug={resource.slug}
            recordId={id}
        />
    ) : (
        <DynamicForm
            schema={schema}
            initialValues={initialValues}
            submitUrl={submitUrl}
            method="put"
            submitLabel={`Update ${resource.label}`}
            cancelUrl={`/admin/${resource.slug}`}
            resourceSlug={resource.slug}
            recordId={id}
        />
    );

    return (
        <AdminLayout pageTitle={`Edit ${resource.label}`}>
            <Breadcrumb
                crumbs={[
                    { label: resource.navigationLabel, href: `/admin/${resource.slug}` },
                    { label: 'Edit' },
                ]}
                heading={`Edit ${resource.label}`}
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
